import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import handler from './api/gerar-plano.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (incluindo GEMINI_API_KEY do .env)
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/gerar-plano')) {
              // Parse body se for POST
              if (req.method === 'POST') {
                let bodyStr = ''
                req.on('data', (chunk: any) => {
                  bodyStr += chunk
                })
                req.on('end', async () => {
                  try {
                    const parsed = bodyStr ? JSON.parse(bodyStr) : {}
                    ;(req as any).body = parsed
                  } catch {
                    ;(req as any).body = {}
                  }

                  const customRes = {
                    setHeader: (k: string, v: string) => res.setHeader(k, v),
                    status: (code: number) => {
                      res.statusCode = code
                      return {
                        json: (data: any) => {
                          res.setHeader('Content-Type', 'application/json')
                          res.end(JSON.stringify(data))
                        },
                        end: () => res.end(),
                      }
                    },
                    end: () => res.end(),
                  }

                  try {
                    await handler(req, customRes)
                  } catch (e: any) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: e.message || 'Erro interno' }))
                  }
                })
                return
              }

              const customRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code
                  return {
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify(data))
                    },
                    end: () => res.end(),
                  }
                },
                end: () => res.end(),
              }
              await handler(req, customRes)
              return
            }
            next()
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
