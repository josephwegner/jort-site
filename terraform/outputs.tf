output "site_url" {
  description = "Canonical production URL"
  value       = "https://${var.domain_name}"
}

output "cloudfront_url" {
  description = "CloudFront URL before DNS is configured"
  value       = module.frontend.cloudfront_url
}

output "s3_bucket" {
  description = "S3 bucket used by the frontend deploy command"
  value       = module.frontend.s3_bucket_name
}

output "cloudflare_dns_records" {
  description = "DNS-only CNAME records to configure in Cloudflare"
  value = {
    "@"   = module.frontend.cloudfront_domain
    "www" = aws_cloudfront_distribution.www_redirect.domain_name
  }
}
