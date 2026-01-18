terraform {
  required_version = ">= 1.6.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
}

provider "kubernetes" {}
provider "helm" {}

module "backend" {
  source = "./modules/backend"
  image  = var.backend_image
}

module "web" {
  source = "./modules/web"
  image  = var.web_image
  api_url = var.api_url
}

module "mongo" {
  source = "./modules/mongo"
  storage_size = var.mongo_storage_size
}
