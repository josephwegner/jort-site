resource "aws_acm_certificate" "site" {
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn = aws_acm_certificate.site.arn
}

module "frontend" {
  source = "git::https://github.com/josephwegner/family-paas.git//terraform/modules/frontend-hosting?ref=main"

  app_name             = var.app_name
  environment          = var.environment
  api_gateway_endpoint = "https://api.${var.domain_name}"
  domain_name          = var.domain_name
  acm_certificate_arn  = aws_acm_certificate_validation.site.certificate_arn
}

resource "aws_s3_bucket" "www_redirect" {
  bucket = "www-${var.app_name}-redirect-${data.aws_caller_identity.current.account_id}"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_website_configuration" "www_redirect" {
  bucket = aws_s3_bucket.www_redirect.id

  redirect_all_requests_to {
    host_name = var.domain_name
    protocol  = "https"
  }
}

resource "aws_cloudfront_distribution" "www_redirect" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = ["www.${var.domain_name}"]
  price_class     = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.www_redirect.website_endpoint
    origin_id   = "www-redirect"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "www-redirect"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
