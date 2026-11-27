# LEGO NATIONS LIVE v2

Mobile-first HTML5 TikTok LIVE territory battle.

## Render setup
Create a new **Web Service** from this repository.
- Root Directory: `server`
- Runtime: Node
- Build Command:
`npm install && rm -rf vendor/tiktok-signer && git clone https://github.com/nglmercer/tiktok-signer.git vendor/tiktok-signer && cd vendor/tiktok-signer && git checkout 07daa175793a0563431f3dd770e323c01562ffc3 && cd packages/tiktok-live && npm install && npm run build`
- Start Command: `npm start`
- Node version: 22 or newer

The LIVE connector only accesses public LIVE events. Never enter TikTok passwords, cookies, or session tokens.
