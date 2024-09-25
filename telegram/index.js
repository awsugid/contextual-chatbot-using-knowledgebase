const serverless = require('serverless-http');
const express = require('express');
const app = express();
const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require("@aws-sdk/client-bedrock-agent-runtime");

const appBotToken = process.env.APP_WEBHOOK_TOKEN || "token-123abc,,,";
const runInBackground = process.env.hasOwnProperty("APP_DAEMONIZE") === true;
const modelId = process.env.APP_MODEL_ID || "anthropic.claude-3-sonnet-20240229-v1:0";
const knowledgeBaseId = process.env.APP_KB_ID || "kb-123abc";

// Create a Bedrock Agent Runtime client
const bedrockClient = new BedrockAgentRuntimeClient();

// Function to perform retrieve and generate operation
async function retrieveAndGenerate(knowledgeBaseId, input, sessionId = "") {
  const kbParams = {
    input: {
      text: input
    },
    retrieveAndGenerateConfiguration: {
      type: "KNOWLEDGE_BASE",
      knowledgeBaseConfiguration: {
        knowledgeBaseId: knowledgeBaseId,
        modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/${modelId}`,
        generationConfiguration: {
          promptTemplate: {
            textPromptTemplate: `
              You are a question answering agent. I will provide you with a set of search results inside the <search></search> tags. The user will provide you with a question inside <question></question> tags. Your job is to answer the user's question using only information from the search results ONLY. 

              If the search results do not contain information that can answer the question, reply with "Sorry, I don't know.". IMPORTANT! Do not try to become smart by providing answer outside the <search></search> result. You will be punished when giving answer outside the <search></search> result.

              Always reply in Bahasa Indonesia whenever possible.

              <search>$search_results$</search>

              <question>$output_format_instructions$</question>
            `
          },
          inferenceConfig: {
            textInferenceConfig: {
              maxTokens: 2048,
              stopSequences: ['Observation'],
              temperature: 0,
              topP: 1
            }
          }
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 10
          }
        }
      }
    },
  };

  if (sessionId !== "") {
    kbParams["sessionId"] = sessionId;
  }
  const command = new RetrieveAndGenerateCommand(kbParams);

  try {
    const response = await bedrockClient.send(command);
    // console.log("Generated text:", response.output.text);
    // console.log("Citations:", response.citations);
    return response;
  } catch (error) {
    console.error("Error in retrieve and generate operation:", error);
    throw error;
  }
}

function extractCitationReferences(citations) {
  const references = [];
  for (const citation of citations) {
    const location = citation.retrievedReferences[0]?.location;
    references.push(location?.s3Location);
  }
  return references;
}

// Bot Token Middleware Auth
function botTokenMiddleware(req, res, next) {
  const userBotToken = req.params.token || '';
  
  console.log(`Comparing bot token user vs App - ${userBotToken} === ${appBotToken}`);
  if (userBotToken !== appBotToken) {
    res.status(401).json({ 'message': 'Token missmatch' });
    return;
  }
  
  next();
}

let currentSessionId = "";
app.post("/bot/:token", botTokenMiddleware, express.json(), async (req, res) => {
  // Format from Telegram Webhooks should be like this 
  // { 
  //   "message": "SOME_MESSAGE", 
  //   "chat": { "id": "CHAT_ID" } 
  // }
  const query = req.body?.message?.text || '-'; 
  const chatId = req.body?.message?.chat?.id || '-';
  const botResponse = {
    method: 'sendMessage',
    chat_id: chatId,
    text: 'Nothing to do.'
  };

  try {
    console.log(req.body);

    const result = await retrieveAndGenerate(knowledgeBaseId, query, currentSessionId);
    console.log(result);
    // console.log(result.citations[0].retrievedReferences[0].location.s3Location);
    // const references = extractCitationReferences(result.citations);
    currentSessionId = result.sessionId;

    // res.json({ text: result.output.text, references: references });
    botResponse.text = result.output.text;
    res.json(botResponse);
  } catch (error) {
    console.error("Error:", error);
    botResponse.text = error.toString();
    res.json(botResponse);
  }
})

// Run this block of code if APP_DAEMONIZE env exists
// Useful for trying the function from CLI without having to deploy to Lambda
if (runInBackground) {
  const port = process.env.NODE_PORT || 8080;
  app.listen(port, () => console.log(`Server running on port ${port}`));

  return;
}

exports.handler = serverless(app);