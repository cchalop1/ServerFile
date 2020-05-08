import { serve } from "https://deno.land/std@v0.42.0/http/server.ts";

const toUTF8 = (buff: ArrayBuffer): string => {
    const decode = new TextDecoder()
    return decode.decode(buff)
}

const localPath = async (): Promise<string> => {
    const pwd = await Deno.run({
        cmd: ['pwd'],
        stdout: 'piped'
    })
    return toUTF8(await pwd.output()).trim()
}

const viewTemplate = (path: string, listFiles: Deno.DirEntry[]): string => {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #303030;
              --color: #fff;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          table th {
            text-align: left;
          }
          table td {
            padding: 12px 24px 0 0;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${path}</h1>
          <table>
          ${listFiles.map((file: Deno.DirEntry) => {
                return `<tr>${file.name}</tr><br>`
             })}
          </table>
        </main>
      </body>
    </html>`
}

let myLocalPath = await localPath()

const s = serve({ port: 8000 });

for await (const req of s) {
    const files = await Deno.readDir(myLocalPath + req.url)
    let listFiles: Deno.DirEntry[] = []

    for await (const file of files) {
        listFiles.push(file)
    }
    const page = viewTemplate(myLocalPath + req.url, listFiles);
    const headers = new Headers();
    headers.set("content-type", "text/html");

    const res = {
        status: 200,
        body: page,
        headers,
    };
    req.respond(res);
}
