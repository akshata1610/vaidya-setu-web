# Publish Vaidya Setu on GitHub

Updated 8 November 2026 for the hosted application 0.3.1 web.

The recommended setup is a public GitHub repository and a public fictional website preview, with sign in for uploads, Sarvam calls and personal archives. A recruiter does not need your approval to inspect the public project or try the prepared demo. Another account cannot access your archived cases through the app.

## Understand the two links

| Link | Purpose | Who can access it |
| --- | --- | --- |
| Your GitHub repository | Source code, README, PRD, research and test evidence | Everyone when you choose Public |
| [Live Vaidya Setu website](https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/) | Use the hosted product | Public pages and fictional preview need no sign in; uploads and archives require ChatGPT sign in |

GitHub does not automatically run uploaded code. GitHub Pages hosts static sites; this app also needs a backend, authentication, a database and private file storage. Keep the existing hosted website and link to it from GitHub. GitHub edits do not automatically update that deployment.

## Upload using your browser

1. Download **Vaidya_Setu_Web_GitHub_Ready.zip** and right click **Extract All** on Windows.
2. Open the extracted **vaidya-setu-web** folder. README.md and package.json should be directly inside it, alongside app, lib, docs and other folders.
3. Sign in to [GitHub](https://github.com/) and select the plus menu, then **New repository**. A repository is an online project folder.
4. Name it **vaidya-setu-web**. Suggested description: **Recorded consultation medication review MVP with patient language audio, private evaluation history and a public fictional demo using Sarvam APIs.**
5. Choose **Public**. Leave Add README and generated ignore file options off because the prepared folder supplies them. Leave the licence unselected until you decide what reuse rights to grant.
6. Click **Create repository**. Choose **upload an existing file** on the empty repository page. For an existing repository, use **Add file**, then **Upload files**.
7. Drag the **contents** of vaidya-setu-web into the upload area. Upload the files and folders, not the ZIP itself. Keep README.md and package.json at the repository root; do not add an extra enclosing project folder.
8. Check the file list. It should contain source, docs and tests. It should not contain recordings, patient case exports, node_modules, .git, .env or credentials. Browser uploads do not use .gitignore to remove files that you select manually.
9. Use the commit message **Add hosted Vaidya Setu MVP and updated PRD**. A commit means a saved version. Click **Commit changes** or **Propose changes**; complete any branch and pull request flow GitHub presents.
10. Open the repository homepage. Its README already has **Open the live demo** at the top and links to the PRD and research.
11. In the repository's **About** section, use its settings control to add this Website URL: **https://vaidya-setu-review-lab.akshata-urs.chatgpt.site/**. This gives visitors another direct route to the product.
12. Open the GitHub link in a signed out or private browser window. Confirm that the files are visible, the README opens and its live demo link works. Test the fictional example without signing in.
13. Copy your actual repository URL to your resume. Its form is **https://github.com/YOUR_USERNAME/vaidya-setu-web**; replace YOUR_USERNAME with your account name. Do not use that placeholder as your actual link.

The prepared export is within GitHub's browser limits of 100 files per upload and 25 MiB per file. See the official [repository quickstart](https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories) and [upload instructions](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## What to include

| Included item | What it shows |
| --- | --- |
| README and live link | The problem, product, access model and current limitations |
| app, components, lib, db and migrations | The current hosted implementation |
| PRD in Word, PDF and Markdown | Product decisions, scope, success metrics and acceptance criteria |
| Market research | Dated numerical evidence and source links |
| Tests and sanitized software log | 32 automated checks with their evidence boundaries |
| Manual acceptance log | Completed anonymous checks and explicit not run entries |
| Setup and build files | How the application is organized and reproduced |

Keep real patient recordings, prescriptions, transcripts, exported case JSON, API keys and authentication tokens out of the repository. Public source means people can inspect and copy it; it does not give them permission to edit your repository or your live website.

## Resume wording

**Vaidya Setu | Product MVP | GitHub | Live demo**

Designed a multilingual recorded consultation review MVP using Sarvam APIs, with medication field evaluation, explicit review controls, route provenance and private correction history. Published a public fictional demo; real recording accuracy and clinical validation remain pending.

Make GitHub link to your repository and Live demo link to the existing website. This package has not been uploaded to your GitHub account automatically.

## Keep later updates clear

The public source is an export of the hosted web implementation, not the earlier Streamlit Python build. Upload the updated docs and web files together. Before claiming a new accuracy result, retain matching source references and original outputs, separate fictional cases and report failed or unscored cases. Deployment of later code changes remains a separate step from committing to GitHub.

Official references: [public repository visibility](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories), [GitHub Pages scope](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
