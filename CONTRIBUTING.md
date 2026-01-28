# Contributing to Telnyx CLI

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/team-telnyx/telnyx-api-cli.git
cd telnyx-api-cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
./bin/dev.js --help
```

## Project Structure

```
src/
├── commands/           # CLI commands (one file per command)
│   ├── auth/
│   ├── message/
│   ├── number/
│   └── ...
├── lib/
│   ├── api.ts          # API client (v1, v2 helpers)
│   ├── base-command.ts # Base class for all commands
│   └── config.ts       # Config file handling
└── index.ts
```

## Adding a New Command

1. Create a new file in `src/commands/<topic>/<action>.ts`
2. Extend `BaseCommand` and implement `run()`
3. Add flags/args using oclif decorators
4. Rebuild and test

Example:

```typescript
import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

export default class MyCommand extends BaseCommand {
  static override description = 'Do something useful'

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ char: 'n', description: 'Name', required: true }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(MyCommand)

    const response = await v2.get('/some-endpoint', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.log(`Result: ${response.data.name}`)
  }
}
```

## Code Style

- TypeScript strict mode
- Use `this.log()` for output, `this.info()` for status messages
- Use `this.warning()` and `this.error()` for problems
- Support `--json` flag for all commands that output data
- Keep commands focused — one action per file

## Testing

```bash
# Run tests
npm test

# Run a specific test
npm test -- --grep "message send"
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add number update command`
- `fix: handle missing profile gracefully`
- `docs: update README examples`
- `refactor: extract pagination helper`

## Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes with clear commits
3. Add/update tests if applicable
4. Update README if adding new commands
5. Open a PR with a clear description

## Reporting Issues

Include:
- CLI version (`telnyx --version`)
- Node.js version (`node --version`)
- OS and version
- Command that failed
- Error message (use `--verbose` if available)

## Questions?

- Open a GitHub issue
- Join [Telnyx Slack](https://joinslack.telnyx.com/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
