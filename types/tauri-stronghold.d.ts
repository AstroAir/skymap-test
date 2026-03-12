declare module '@tauri-apps/plugin-stronghold' {
  export interface StrongholdStore {
    get(key: string): Promise<ArrayLike<number> | null>;
    insert(key: string, value: number[]): Promise<void>;
    remove(key: string): Promise<void>;
  }

  export interface StrongholdClient {
    getStore(name: string): Promise<StrongholdStore>;
  }

  export interface StrongholdInstance {
    save(): Promise<void>;
    loadClient(name: string): Promise<StrongholdClient>;
    createClient(name: string): Promise<StrongholdClient>;
  }

  export const Stronghold: {
    load(path: string, password: string): Promise<StrongholdInstance>;
  };
}
