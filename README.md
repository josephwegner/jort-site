# Jort site

A dependency-free static marketing site for Jort.

## Local preview

Open `index.html` directly, or serve this directory with any static file server:

```sh
python3 -m http.server 8000
```

The download and GitHub links are intentionally placeholders. Replace links marked with `data-placeholder-link` in `index.html` when their destinations are ready.

## Build

```sh
npm install
npm run build
```

The static distribution is written to `dist/`.

## Deployment

Production hosting uses the `family-paas` S3 and CloudFront module. Terraform provisions the distributions, TLS certificate, and the `www.jort.app` redirect. Cloudflare remains the authoritative DNS provider.

1. Set the repository secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
2. Add the ACM validation CNAME records to Cloudflare as DNS-only records.
3. Run the `Terraform` GitHub Actions workflow to create the infrastructure.
4. Copy the `cloudflare_dns_records` Terraform output into DNS-only CNAME records for `@` and `www` in Cloudflare.
5. Run the `Deploy site` workflow, or push a site change to `main`.

For a deployment from a locally authenticated AWS CLI:

```sh
npm run deploy:frontend
```

Keep Cloudflare proxying disabled for the records that target CloudFront. CloudFront handles TLS, compression, and CDN caching directly.

## Record the hero demo

The demo recorder launches the bundled `Jort.app`, types the scripted document,
waits for the `/pm` and `/rewrite` tools to insert their responses, and records
the Jort window with FFmpeg:

```sh
npm run record:demo
```

Before the first run, grant Screen Recording access to your terminal and grant
it Accessibility access under **System Settings > Privacy & Security**. The
recorder clears Jort's current document, so use a disposable Jort document.

The resulting `recordings/jort-demo.mp4` and `recordings/jort-demo.webm` files
are ready for use on the website. If tool responses take longer than expected,
increase their maximum waits:

```sh
PM_WAIT_SECONDS=25 REWRITE_WAIT_SECONDS=45 npm run record:demo
```

FFmpeg's screen device is `4` on the development machine. Run
`ffmpeg -f avfoundation -list_devices true -i ""` and set `DISPLAY_INDEX` if
the screen index changes. The crop can likewise be overridden with `WINDOW_X`,
`WINDOW_Y`, `WINDOW_WIDTH`, and `WINDOW_HEIGHT`. The default `DISPLAY_SCALE=2`
matches a Retina display; set it to `1` for a non-Retina display.
