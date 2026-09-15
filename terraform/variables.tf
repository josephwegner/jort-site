variable "app_name" {
  description = "Application name"
  type        = string
  default     = "jort"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Canonical hostname for the site"
  type        = string
  default     = "jort.app"
}
