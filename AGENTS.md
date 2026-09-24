# Agent Instructions

## Website projects

- Do not deploy websites automatically. Deploy only when the user explicitly requests it. When deployment is requested without a hosting preference, use Cloudflare Pages and verify that it works; follow an explicit request for a different platform.
- Host the source code on GitHub. Create the repository as **public** by default unless the user requests a private repository.
- Use the installed `gh` CLI for GitHub operations and prefer SSH Git remotes. The machine is expected to have GitHub SSH authentication configured. If an authentication check fails because of sandbox restrictions, retry the relevant command with elevated permissions rather than assuming the user is logged out.
- Choose mature, stable frameworks and dependencies that fit the project's needs. For a simple site, plain HTML, CSS, and JavaScript are acceptable when a framework would add unnecessary complexity.

## Delivery

- Keep deployment configuration and build instructions in the repository so the site can be rebuilt and deployed again.
- Do not commit credentials, API tokens, or other secrets. Use the hosting platform's environment variables for secrets when needed.
- Before reporting completion, run the relevant build or checks and provide the GitHub repository link. Provide a live site link only when the user has requested deployment and it is available.
