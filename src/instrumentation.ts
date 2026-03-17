/**
 * Next.js Instrumentation File
 * This runs on the server BEFORE any other module code, making it safe to set global polyfills.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
    // Polyfill File and Blob for Node.js 18 compatibility
    // (Required by undici/fetch internals which reference `File` at module init time)
    if (typeof globalThis.File === 'undefined') {
        try {
            // Node 20+ has File in globalThis already; Node 18 keeps it in node:buffer
            const { File } = await import('node:buffer' as any);
            if (File) (globalThis as any).File = File;
        } catch {
            // Minimal fallback shim
            (globalThis as any).File = class File {
                name: string;
                lastModified: number;
                size: number = 0;
                type: string = '';
                constructor(_chunks: any[], name: string, options?: any) {
                    this.name = name;
                    this.lastModified = options?.lastModified ?? Date.now();
                    this.type = options?.type ?? '';
                }
                text() { return Promise.resolve(''); }
                arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
                stream() { return new ReadableStream(); }
                slice() { return new Blob(); }
            };
        }
    }

    if (typeof globalThis.Blob === 'undefined') {
        try {
            const { Blob } = await import('node:buffer' as any);
            if (Blob) (globalThis as any).Blob = Blob;
        } catch {
            // Minimal fallback
            (globalThis as any).Blob = class Blob {
                size: number = 0;
                type: string = '';
                text() { return Promise.resolve(''); }
                arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
                stream() { return new ReadableStream(); }
                slice() { return new Blob(); }
            };
        }
    }
}
