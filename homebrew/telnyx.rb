# Homebrew formula for Telnyx CLI
# To use: brew install telnyx/tap/telnyx
#
# This formula is designed to be hosted in a tap repository:
# https://github.com/telnyx/homebrew-tap

class Telnyx < Formula
  desc "Command-line interface for Telnyx APIs"
  homepage "https://github.com/team-telnyx/telnyx-api-cli"
  url "https://registry.npmjs.org/@telnyx/api-cli/-/api-cli-1.0.0.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node@20"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/run.js" => "telnyx"
  end

  test do
    assert_match "telnyx", shell_output("#{bin}/telnyx --version")
    assert_match "auth", shell_output("#{bin}/telnyx --help")
  end
end
