/*
 * Inspect and manage Sanity Context KB issues for kbOSaaWFy5yI.
 * Reads the CLI login token from ~/.config/sanity/config.json (never prints it).
 * Usage:
 *   NODE_PATH=<repo>/web/node_modules node seed/kb-issues.cjs list
 *   NODE_PATH=<repo>/web/node_modules node seed/kb-issues.cjs dismiss <issueId> ...
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const {createClient} = require('@sanity/client')

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
const ctx = createClient({
  projectId: 'mx12urdz',
  dataset: 'production',
  apiVersion: '2026-08-25',
  useCdn: false,
  token: cfg.authToken,
  context: {organizationId: 'oul432e18'},
  resource: {type: 'knowledge-base', id: 'kbOSaaWFy5yI'},
}).context

const cmd = process.argv[2] || 'list'

;(async () => {
  if (cmd === 'list') {
    const issues = await ctx.issues.list()
    console.log('OPEN/ALL ISSUES:', issues.length)
    for (const i of issues) {
      console.log('\n----------------------------------------')
      console.log('id:', i.id || i._id || i.issueId)
      console.log('status:', i.status || i.state)
      const c = i.content || {}
      console.log('claimKey:', c.claimKey)
      console.log('current:', c.currentClaim)
      console.log('alternative:', c.alternativeClaim)
      console.log('issue:', c.issue)
      console.log('scopes:', JSON.stringify(c.involvedScopes))
    }
  } else if (cmd === 'dismiss') {
    const ids = process.argv.slice(3)
    for (const id of ids) {
      let out
      try {
        out = await ctx.issues.dismiss({issueId: id})
      } catch (e) {
        out = await ctx.issues.dismiss(id)
      }
      console.log('dismissed', id, '->', out && (out.status || out.state || 'ok'))
    }
  }
})().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
