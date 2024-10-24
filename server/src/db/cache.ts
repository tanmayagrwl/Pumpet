import NodeCache from "node-cache";

let MySessionCache: NodeCache;

async function InitialiseCache() {
  MySessionCache = new NodeCache();
}

export default async () => {
  if (!MySessionCache) {
    await InitialiseCache();
  }

  return MySessionCache;
};
