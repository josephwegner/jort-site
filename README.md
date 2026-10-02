# Jort site

A dependency-free static marketing site for Jort.

## Local preview

Open `index.html` directly, or serve this directory with any static file server:

```sh
python3 -m http.server 8000
```

The selected design lives in `index.html`, `styles.css`, and `script.js`.
The former `concepts/index.html` preview redirects to the main site.

Edit copy in `index.html`. Colors, spacing, and responsive layouts live in
`styles.css`; the locked mosaic layout and rotation settings are at the top of
`script.js`. Feature sections alternate sides on desktop and use title, visual,
then description at widths of 760px and below. The screenshot frames use a 30%
opaque yellow background; the screenshots themselves remain opaque.

The demo video plays muted and loops. On mobile it sits in the purple section
in normal page flow, without the desktop growth and pinning effect. The mobile
feature navigation sits just below the video and scrolls normally with the page. Native controls remain available if autoplay is
restricted. Scroll effects share one animation loop, cache layout measurements,
and honor reduced-motion preferences. Images reserve their dimensions and load
lazily; all media is served separately for caching. The page remains usable
without JavaScript.

## Build

```sh
npm install
npm run build
```

The static distribution is written to `dist/`, including only the media referenced by the page. Building does not publish the site.

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
