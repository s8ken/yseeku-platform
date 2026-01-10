resource "kubernetes_stateful_set" "mongo" {
  metadata { name = "mongo" labels = { app = "mongo" } }
  spec {
    service_name = "mongo"
    selector { match_labels = { app = "mongo" } }
    replicas = 1
    template {
      metadata { labels = { app = "mongo" } }
      spec {
        container {
          image = "mongo:7"
          name  = "mongo"
          port { container_port = 27017 }
          volume_mount { name = "data" mount_path = "/data/db" }
        }
      }
    }
    volume_claim_template {
      metadata { name = "data" }
      spec {
        access_modes = ["ReadWriteOnce"]
        resources { requests = { storage = var.storage_size } }
      }
    }
  }
}

resource "kubernetes_service" "mongo" {
  metadata { name = "mongo" }
  spec {
    selector = { app = "mongo" }
    port { port = 27017 target_port = 27017 }
  }
}
