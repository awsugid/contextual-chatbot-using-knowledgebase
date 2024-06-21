# Overview

Repositori ini diturunkan dari [aws-samples/contextual-chatbot-using-knowledgebase](https://github.com/aws-samples/amazon-bedrock-samples/tree/main/rag-solutions/contextual-chatbot-using-knowledgebase). Untuk dokumentasi detil silahkan merujuk ke GitHub repo tersebut.

Solusi pada repo ini berfokus pada bagaimana menggunakan Amazon Bedrock Knowledge Bases untuk percapakan Bahasa Indonesia. Gambaran umum implementasi RAG yang akan digunakan seperti berikut:

![RAG](images/architecture_2.jpg)

Solusi ini menggunakan [Streamlit](http://streamlit/) untuk membangun aplikasi chatbot dan menggunakan beberapa layanan AWS berikut:

* [Amazon Simple Storage Service)](https://aws.amazon.com/s3/) (Amazon S3) as source
* Knowledge Bases for Amazon Bedrock untuk data ingestion
* [Amazon OpenSearch Serverless](https://aws.amazon.com/opensearch-service/features/serverless/) vector store untuk menyimpman embedding text
* [AWS Lambda](https://aws.amazon.com/lambda/) sebagai API yang akan memanggil Knowledge Bases API
* Streamlit akan memanggil Lambda function untuk memproses chat dari user dan mendapatkan jawaban dari Knowledge Bases
* Embedding models yang digunakan pada Knowledge Bases adalah [Amazon Titan Text Embeddings v2](https://aws.amazon.com/bedrock/titan/).
* Untuk memproses prompt dari user dan konteks dari embedding models digunakan model [Claude 3 Sonnet](https://aws.amazon.com/bedrock/claude/) dari Anthropic.

## Prasyarat

Anda perlu mengaktifkan model-model yang akan digunakan di Amazon Bedrock melalui halaman [Model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) sebelum memulai. Anda perlu mengaktifkan model-model berikut:

- Titan Text Embeddings v2
- Claude 3 Sonnet

## Download source data

Sumber dokumen yang digunakan untuk tes adalah sebuah PDF laporan keuangan dari Amazon pada Q4 2023. Download file-nya disini:

- [Amazon Q4 earnings](https://s2.q4cdn.com/299287126/files/doc_financials/2023/q4/AMZN-Q4-2023-Earnings-Release.pdf)

## Clone repository

Clone repository ini ke mesin Anda.

```sh
git clone 
```

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
