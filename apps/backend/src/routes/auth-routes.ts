import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { authAdminRealm, authRealm } from '@/shared/auth.ts'
import { env } from '@/shared/env'

const authRoutes: FastifyPluginAsyncZod = async (server) => {
  server.addHook('preHandler', server.auth([server.keycloakAuth]))

  server.post('/logout', async (req, reply) => {
    const authUrl = `${authRealm}/protocol/openid-connect/token`
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.VITE_AUTH_ADMIN_CLIENT_ID,
        client_secret: env.VITE_AUTH_ADMIN_CLIENT_SECRET,
      }),
    })

    if (!authResponse.ok)
      return reply.status(401).send('Ошибка удалении сессии')

    const token = (await authResponse.json()) as { access_token?: string }
    const accessToken = token.access_token ?? ''

    const logoutUrl = `${authAdminRealm}/users/${req.user.sub}/logout`
    const logoutResponse = await fetch(logoutUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST',
    })

    if (!logoutResponse.ok) {
      server.log.error(await logoutResponse.text())
      return reply.status(401).send('Ошибка удалении сессии')
    }
    return reply.status(200).send()
  })
}

export default authRoutes
