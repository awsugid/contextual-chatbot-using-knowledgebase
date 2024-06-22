import os
import boto3

boto3_session = boto3.session.Session()
region = boto3_session.region_name

# create a boto3 bedrock client
bedrock_agent_runtime_client = boto3.client('bedrock-agent-runtime')

# get knowledge base id from environment variable
kb_id = os.environ.get("KNOWLEDGE_BASE_ID")

system_prompt = """
You are a question answering agent. I will provide you with a set of search results inside the <search></search> tags. The user will provide you with a question inside <question></question> tags. Your job is to answer the user's question using only information from the search results ONLY. 

If the search results do not contain information that can answer the question, reply with "Sorry, I don't know.". IMPORTANT! Do not try to become smart by providing answer outside the <search></search> result. You will be punished when giving answer outside the <search></search> result.

Always reply in Bahasa Indonesia whenever possible.

<search>$search_results$</search>

<question>$output_format_instructions$</question>
"""

# declare model id for calling RetrieveAndGenerate API
model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
model_arn = f'arn:aws:bedrock:{region}::foundation-model/{model_id}'

def rag(input, session_id):
    print(input, kb_id, model_arn, session_id)
    if session_id != "":
        return bedrock_agent_runtime_client.retrieve_and_generate(
            input={
                'text': input
            },
            sessionId=session_id,
            retrieveAndGenerateConfiguration={
                'type': 'KNOWLEDGE_BASE',
                'knowledgeBaseConfiguration': {
                    'knowledgeBaseId': kb_id,
                    'modelArn': model_arn,
                    'generationConfiguration': {
                        'promptTemplate': {
                            'textPromptTemplate': system_prompt
                        },
                        'inferenceConfig': {
                            'textInferenceConfig': {
                                'maxTokens': 2048,
                                'stopSequences': ['Observation'],
                                'temperature': 0,
                                'topP': 1
                            }
                        },
                    },
                    'retrievalConfiguration': {
                        'vectorSearchConfiguration': {
                            'numberOfResults': 10 # will fetch top N documents which closely match the query
                        },
                    },
                }
            }
        )

    return bedrock_agent_runtime_client.retrieve_and_generate(
        input={
            'text': input
        },
        retrieveAndGenerateConfiguration={
            'type': 'KNOWLEDGE_BASE',
            'knowledgeBaseConfiguration': {
                'knowledgeBaseId': kb_id,
                'modelArn': model_arn,
                'generationConfiguration': {
                    'promptTemplate': {
                        'textPromptTemplate': system_prompt
                    },
                    'inferenceConfig': {
                        'textInferenceConfig': {
                            'maxTokens': 2048,
                            'stopSequences': ['Observation'],
                            'temperature': 0,
                            'topP': 1
                        }
                    },
                },
                'retrievalConfiguration': {
                    'vectorSearchConfiguration': {
                        'numberOfResults': 10 # will fetch top N documents which closely match the query
                    },
                },
            }
        }
    )

# Lambda main entrypoint
def lambda_handler(event, context):
    query = event['question']
    session_id = event['sessionId']
    response = rag(query, session_id)
    generated_text = response['output']['text']
    print(generated_text)
    citations = response['citations']
    return {
        'statusCode': 200,
        'body': {"question": query.strip(), "answer": generated_text.strip(), "sessionId":session_id, "citations":citations}
    }