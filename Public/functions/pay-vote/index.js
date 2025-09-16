// This is the pay-vote function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve((req) => {
  return new Response("Voting payment started!", { status: 200 });
});
 