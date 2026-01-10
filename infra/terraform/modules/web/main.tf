resource "kubernetes_deployment" "web" {
  metadata { name = "yseeku-web" labels = { app = "yseeku-web" } }
  spec {
    selector { match_labels = { app = "yseeku-web" } }
    replicas = 2
    template {
      metadata { labels = { app = "yseeku-web" } }
      spec {
        container {
          image = var.image
          name  = "web"
          port { container_port = 3000 }
          env { name = "NODE_ENV" value = "production" }
          env { name = "NEXT_PUBLIC_API_URL" value = var.api_url }
        }
      }
    }
  }
}

resource "kubernetes_service" "web" {
  metadata { name = "yseeku-web" }
  spec {
    selector = { app = "yseeku-web" }
    port { port = 3000 target_port = 3000 }
  }
}
