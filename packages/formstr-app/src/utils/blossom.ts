export class BlossomError extends Error {
  isCorsError: boolean;

  constructor(message: string, opts?: { isCorsError?: boolean }) {
    super(message);
    this.name = "BlossomError";
    this.isCorsError = opts?.isCorsError ?? false;
  }
}

export class BlossomClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async upload(blob: Uint8Array, authHeader: string): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/upload`, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/octet-stream",
        },
        body: blob as BodyInit, // cast fixes TS
      });
    } catch (e) {
      if (e instanceof TypeError) {
        throw new BlossomError(
          `Network error: Unable to reach ${this.baseUrl}. This may be a CORS issue.`,
          { isCorsError: true }
        );
      }
      throw e;
    }

    if (!res.ok) {
      throw new BlossomError(res.headers.get("X-Reason") || res.statusText);
    }
    return res.text();
  }

  async download(sha256: string, authHeader?: string): Promise<Uint8Array> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/${sha256}`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
    } catch (e) {
      if (e instanceof TypeError) {
        throw new BlossomError(
          `Network error: Unable to reach ${this.baseUrl}. This may be a CORS issue.`,
          { isCorsError: true }
        );
      }
      throw e;
    }

    if (!res.ok) {
      throw new BlossomError(res.headers.get("X-Reason") || res.statusText);
    }

    return new Uint8Array(await res.arrayBuffer());
  }

  async delete(sha256: string, authHeader: string): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/${sha256}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      });
    } catch (e) {
      if (e instanceof TypeError) {
        throw new BlossomError(
          `Network error: Unable to reach ${this.baseUrl}. This may be a CORS issue.`,
          { isCorsError: true }
        );
      }
      throw e;
    }

    if (!res.ok) {
      throw new BlossomError(res.headers.get("X-Reason") || res.statusText);
    }
  }
}
