interface mapToolsOptions {
  id?: string;
  el?: string;
  lat: number;
  lng: number;
  type?: string;
  async?: boolean;
  sync?: boolean;
  on?: {}
}

interface mapToolsCallback {
  (err: {}, instance?: {}): void;
}
