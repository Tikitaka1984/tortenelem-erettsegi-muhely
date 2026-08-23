'use strict';

module.exports=function configEndpoint(request,response){
  response.setHeader('Cache-Control','no-store, max-age=0');
  response.setHeader('Content-Type','application/json; charset=utf-8');
  const supabaseUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
  if(!supabaseUrl||!supabaseKey){
    response.statusCode=503;
    response.end(JSON.stringify({error:'cloud_configuration_unavailable'}));
    return;
  }
  response.statusCode=200;
  response.end(JSON.stringify({supabaseUrl,supabaseKey}));
};
