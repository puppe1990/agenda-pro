import { createFileRoute } from '@tanstack/react-router'

import { processDueNotifications } from '#/jobs/notifications'

export const Route = createFileRoute('/api/cron/notifications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET
        if (secret) {
          const auth = request.headers.get('authorization')
          if (auth !== `Bearer ${secret}`) {
            return new Response('Unauthorized', { status: 401 })
          }
        }

        const processed = await processDueNotifications()
        return Response.json({ processed })
      },
    },
  },
})
