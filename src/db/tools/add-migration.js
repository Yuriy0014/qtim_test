// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process')

const arg = process.argv[2]
if (!arg) throw new Error('🚨 Pass the name for migration')
const command = `typeorm-ts-node-commonjs migration:generate -d ./src/db/data-source.ts ./src/db/migrations/${arg}`
execSync(command, { stdio: 'inherit' })
