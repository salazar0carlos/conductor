import type { ApiRequest, KeyValue } from './types';
import { headersToObject, buildUrl } from './utils';

export type CodeLanguage =
  | 'javascript-fetch'
  | 'javascript-axios'
  | 'python'
  | 'curl'
  | 'php'
  | 'ruby'
  | 'go'
  | 'java';

export interface CodeSnippet {
  language: CodeLanguage;
  label: string;
  code: string;
}

function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function generateJavaScriptFetch(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let options = `{
  method: '${request.method}'`;

  if (Object.keys(headers).length > 0) {
    options += `,
  headers: ${JSON.stringify(headers, null, 4)}`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      options += `,
  body: JSON.stringify(${request.body.json})`;
    } else if (request.body.type === 'raw' && request.body.raw) {
      options += `,
  body: '${escapeString(request.body.raw)}'`;
    }
  }

  options += '\n}';

  return `fetch('${url}', ${options})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
}

function generateJavaScriptAxios(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let config = `{
  method: '${request.method.toLowerCase()}',
  url: '${url}'`;

  if (Object.keys(headers).length > 0) {
    config += `,
  headers: ${JSON.stringify(headers, null, 4)}`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      config += `,
  data: ${request.body.json}`;
    } else if (request.body.type === 'raw' && request.body.raw) {
      config += `,
  data: '${escapeString(request.body.raw)}'`;
    }
  }

  config += '\n}';

  return `const axios = require('axios');

axios(${config})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`;
}

function generatePython(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let code = `import requests\n\n`;
  code += `url = "${url}"\n`;

  if (Object.keys(headers).length > 0) {
    code += `headers = ${JSON.stringify(headers, null, 4).replace(/"/g, "'")}\n`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      code += `data = ${request.body.json.replace(/"/g, "'")}\n`;
    } else if (request.body.type === 'raw' && request.body.raw) {
      code += `data = "${escapeString(request.body.raw)}"\n`;
    }
  }

  code += `\nresponse = requests.${request.method.toLowerCase()}(url`;

  if (Object.keys(headers).length > 0) {
    code += `, headers=headers`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json') {
      code += `, json=data`;
    } else {
      code += `, data=data`;
    }
  }

  code += `)\n\nprint(response.json())`;

  return code;
}

function generateCurl(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let curl = `curl -X ${request.method} '${url}'`;

  Object.entries(headers).forEach(([key, value]) => {
    curl += ` \\\n  -H '${key}: ${value}'`;
  });

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      curl += ` \\\n  -d '${request.body.json.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
    } else if (request.body.type === 'raw' && request.body.raw) {
      curl += ` \\\n  -d '${escapeString(request.body.raw)}'`;
    }
  }

  return curl;
}

function generatePHP(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let code = `<?php\n\n`;
  code += `$url = "${url}";\n`;

  if (Object.keys(headers).length > 0) {
    code += `$headers = array(\n`;
    Object.entries(headers).forEach(([key, value], index, arr) => {
      code += `    "${key}: ${value}"`;
      if (index < arr.length - 1) code += ',';
      code += '\n';
    });
    code += `);\n`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      code += `$data = '${request.body.json.replace(/\n/g, '').replace(/\s+/g, ' ')}';\n`;
    }
  }

  code += `\n$ch = curl_init($url);\n`;
  code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
  code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${request.method}");\n`;

  if (Object.keys(headers).length > 0) {
    code += `curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n`;
  }

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    code += `curl_setopt($ch, CURLOPT_POSTFIELDS, $data);\n`;
  }

  code += `\n$response = curl_exec($ch);\n`;
  code += `curl_close($ch);\n\n`;
  code += `echo $response;\n`;
  code += `?>`;

  return code;
}

function generateRuby(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let code = `require 'net/http'\n`;
  code += `require 'json'\n\n`;
  code += `uri = URI('${url}')\n`;

  code += `http = Net::HTTP.new(uri.host, uri.port)\n`;
  if (url.startsWith('https')) {
    code += `http.use_ssl = true\n`;
  }

  code += `\nrequest = Net::HTTP::${request.method.charAt(0) + request.method.slice(1).toLowerCase()}.new(uri.request_uri)\n`;

  Object.entries(headers).forEach(([key, value]) => {
    code += `request['${key}'] = '${value}'\n`;
  });

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      code += `request.body = '${request.body.json.replace(/\n/g, '').replace(/\s+/g, ' ')}';\n`;
    }
  }

  code += `\nresponse = http.request(request)\n`;
  code += `puts JSON.parse(response.body)`;

  return code;
}

function generateGo(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let code = `package main\n\n`;
  code += `import (\n`;
  code += `    "fmt"\n`;
  code += `    "io/ioutil"\n`;
  code += `    "net/http"\n`;
  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    code += `    "strings"\n`;
  }
  code += `)\n\n`;
  code += `func main() {\n`;
  code += `    url := "${url}"\n`;

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      const escapedBody = request.body.json
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"');
      code += `    payload := strings.NewReader("${escapedBody}")\n`;
    } else {
      code += `    payload := strings.NewReader("")\n`;
    }
    code += `    req, _ := http.NewRequest("${request.method}", url, payload)\n`;
  } else {
    code += `    req, _ := http.NewRequest("${request.method}", url, nil)\n`;
  }

  Object.entries(headers).forEach(([key, value]) => {
    code += `    req.Header.Add("${key}", "${value}")\n`;
  });

  code += `\n    res, _ := http.DefaultClient.Do(req)\n`;
  code += `    defer res.Body.Close()\n`;
  code += `    body, _ := ioutil.ReadAll(res.Body)\n\n`;
  code += `    fmt.Println(string(body))\n`;
  code += `}`;

  return code;
}

function generateJava(request: ApiRequest): string {
  const headers = headersToObject(request.headers);
  const url = buildUrl(request.url, request.queryParams);

  let code = `import java.net.http.HttpClient;\n`;
  code += `import java.net.http.HttpRequest;\n`;
  code += `import java.net.http.HttpResponse;\n`;
  code += `import java.net.URI;\n\n`;
  code += `public class ApiRequest {\n`;
  code += `    public static void main(String[] args) throws Exception {\n`;
  code += `        HttpClient client = HttpClient.newHttpClient();\n\n`;

  code += `        HttpRequest.Builder builder = HttpRequest.newBuilder()\n`;
  code += `            .uri(URI.create("${url}"))\n`;

  Object.entries(headers).forEach(([key, value]) => {
    code += `            .header("${key}", "${value}")\n`;
  });

  if (
    request.body.type !== 'none' &&
    ['POST', 'PUT', 'PATCH'].includes(request.method)
  ) {
    if (request.body.type === 'json' && request.body.json) {
      const escapedBody = request.body.json
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"');
      code += `            .${request.method}(HttpRequest.BodyPublishers.ofString("${escapedBody}"));\n`;
    } else {
      code += `            .${request.method}(HttpRequest.BodyPublishers.noBody());\n`;
    }
  } else {
    code += `            .${request.method}();\n`;
  }

  code += `\n        HttpRequest request = builder.build();\n`;
  code += `        HttpResponse<String> response = client.send(request,\n`;
  code += `            HttpResponse.BodyHandlers.ofString());\n\n`;
  code += `        System.out.println(response.body());\n`;
  code += `    }\n`;
  code += `}`;

  return code;
}

export function generateCode(
  request: ApiRequest,
  language: CodeLanguage
): string {
  switch (language) {
    case 'javascript-fetch':
      return generateJavaScriptFetch(request);
    case 'javascript-axios':
      return generateJavaScriptAxios(request);
    case 'python':
      return generatePython(request);
    case 'curl':
      return generateCurl(request);
    case 'php':
      return generatePHP(request);
    case 'ruby':
      return generateRuby(request);
    case 'go':
      return generateGo(request);
    case 'java':
      return generateJava(request);
    default:
      return '// Code generation not supported for this language';
  }
}

export function getAllCodeSnippets(request: ApiRequest): CodeSnippet[] {
  const languages: Array<{ language: CodeLanguage; label: string }> = [
    { language: 'javascript-fetch', label: 'JavaScript (Fetch)' },
    { language: 'javascript-axios', label: 'JavaScript (Axios)' },
    { language: 'python', label: 'Python' },
    { language: 'curl', label: 'cURL' },
    { language: 'php', label: 'PHP' },
    { language: 'ruby', label: 'Ruby' },
    { language: 'go', label: 'Go' },
    { language: 'java', label: 'Java' },
  ];

  return languages.map(({ language, label }) => ({
    language,
    label,
    code: generateCode(request, language),
  }));
}
