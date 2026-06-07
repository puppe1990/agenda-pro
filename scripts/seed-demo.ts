import { seedDemoOrganization } from '#/server/db/seed'

const orgId = await seedDemoOrganization()
console.log(`Demo organization seeded: ${orgId}`)
console.log('Public booking URL path: /book/studio-demo')
