// Ambient types per silenziare i warning del TS language server
// quando si aprono i file Edge Function nell'IDE senza la Deno extension.
// Il runtime reale è Deno su Supabase: queste dichiarazioni servono solo
// per l'IDE locale, non finiscono in bundle.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module "https://esm.sh/@supabase/supabase-js@2.45.4" {
  export * from "@supabase/supabase-js";
}
