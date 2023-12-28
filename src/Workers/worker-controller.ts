import "threads/register"
import { ModuleThread, registerSerializer, spawn } from "threads"
import { CustomErrorSerializer } from "../Generic/lib/errors"
import { NetWorker as NetWorkerInterface } from "./net-worker"

// Load worker eagerly
const netWorker = new Worker(new URL("./net-worker.ts", import.meta.url))

registerSerializer(CustomErrorSerializer)

async function spawnNetWorker() {
  window.addEventListener("message", event => {
    if (event.data && ["app:pause", "app:resume"].indexOf(event.data) > -1) {
      netWorker.postMessage(event.data)
    }
  })

  const worker = await spawn<NetWorkerInterface>(netWorker)
  await worker.enableLogging(localStorage.getItem("debug") || "")

  return worker
}

async function spawnWorkers() {
  return {
    netWorker: await spawnNetWorker()
  }
}

export const workers = spawnWorkers()

export type NetWorker = ModuleThread<NetWorkerInterface>
