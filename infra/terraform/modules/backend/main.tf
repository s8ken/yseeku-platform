resource "kubernetes_deployment" "backend" {
  metadata { name = "yseeku-backend" labels = { app = "yseeku-backend" } }
  spec {
    selector { match_labels = { app = "yseeku-backend" } }
    replicas = 2
    template {
      metadata { labels = { app = "yseeku-backend" } }
      spec {
        container {
          image = var.image
          name  = "backend"
          port { container_port = 3001 }
          env { name = "NODE_ENV" value = "production" }
          env { name = "PORT" value = "3001" }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata { name = "yseeku-backend" }
  spec {
    selector = { app = "yseeku-backend" }
    port { port = 3001 target_port = 3001 }
  }
}
