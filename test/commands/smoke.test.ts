import { expect } from 'chai'
import { runCommand } from '@oclif/test'

/**
 * Smoke tests - verify all commands parse correctly and show help
 * These tests don't require API mocking since they only test --help
 */
describe('smoke tests', () => {
  const commands = [
    // Auth
    'auth status',
    'auth setup',
    'auth whoami',
    
    // Numbers
    'number list',
    'number get',
    'number search',
    'number order',
    'number update',
    'number delete',
    
    // Messages
    'message list',
    'message get',
    'message send',
    
    // Calls
    'call list',
    'call dial',
    'call hangup',
    'call speak',
    'call transfer',
    
    // Debugger
    'debugger list',
    'debugger get',
    
    // 10DLC
    '10dlc wizard',
    '10dlc brand list',
    '10dlc brand get',
    '10dlc brand create',
    '10dlc campaign list',
    '10dlc campaign create',
    '10dlc usecases',
    '10dlc verticals',
    '10dlc assign',
    
    // Messaging profiles
    'messaging-profile list',
    'messaging-profile get',
    'messaging-profile create',
    'messaging-profile delete',
    
    // Connections
    'connection list',
    'connection get',
    'connection create',
    'connection delete',
    
    // Voice profiles
    'voice-profile list',
    'voice-profile get',
    'voice-profile create',
    'voice-profile delete',
    
    // Verify
    'verify send',
    'verify check',
    'verify profile list',
    'verify profile create',
    'verify template list',
    
    // Fax
    'fax list',
    'fax get',
    'fax send',
    'fax delete',
    
    // Lookup
    'lookup number',
    
    // Porting
    'porting check',
    'porting order list',
    'porting order get',
    'porting order create',
    'porting order submit',
    'porting order cancel',
    
    // E911
    'e911 address list',
    'e911 address get',
    'e911 address create',
    'e911 address delete',
    'e911 assign',
    
    // SIM
    'sim list',
    'sim get',
    'sim enable',
    'sim disable',
    
    // Storage
    'storage bucket list',
    'storage bucket create',
    'storage bucket delete',
    'storage object list',
    'storage object get',
    'storage object put',
    'storage object delete',
    'storage presign',
    
    // AI
    'ai chat',
    'ai models',
    'ai embed',
    
    // Assistant
    'assistant list',
    'assistant get',
    'assistant create',
    'assistant delete',
    'assistant call',
    
    // Video
    'video room list',
    'video room create',
    'video room delete',
    'video room token',
    'video session list',
    'video recording list',
    
    // Usage
    'usage options',
    'usage report',
    
    // Billing
    'billing balance',
    'billing group list',
    'billing group create',
    'billing group delete',
  ]

  for (const cmd of commands) {
    it(`"${cmd}" should show help`, async () => {
      const args = [...cmd.split(' '), '--help']
      const { stdout, error } = await runCommand(args)
      
      // Should not error
      expect(error).to.be.undefined
      
      // Should show usage info
      expect(stdout).to.include('USAGE')
    })
  }

  describe('top-level', () => {
    it('should show version', async () => {
      const { stdout } = await runCommand(['--version'])
      expect(stdout).to.include('telnyx')
    })

    it('should show help', async () => {
      const { stdout } = await runCommand(['--help'])
      expect(stdout).to.include('USAGE')
      expect(stdout).to.include('COMMANDS')
    })
  })
})
