import { Application, Router } from "https://deno.land/x/oak@v6.3.0/mod.ts";
import { OAuth2Client } from "../src/oauth2_client.ts";
import { decode } from "https://deno.land/x/djwt@v2.7/mod.ts";

const urlBase = "https://qaautenticaciondigital.and.gov.co/";
const redirectUriPostLogout = "http://localhost:8000/index";

const oauth2Client = new OAuth2Client({
  clientId: "DENO_Dev",
  authorizationEndpointUri: urlBase + "connect/authorize",
  tokenUri: urlBase + "connect/token",
  redirectUri: "http://localhost:8000/oauth2/callback",
  defaults: {
    scope: "co_scope openid",
  },
});

const router = new Router();
router.get("/login", (ctx) => {
  ctx.response.redirect(
    oauth2Client.code.getAuthorizationUri(),
  );
});
router.get("/oauth2/callback", async (ctx) => {
  const claims = localStorage.getItem('claims');
  if(claims == null || claims == undefined || claims == ''){
      // Exchange the authorization code for an access token
      const tokens = await oauth2Client.code.getToken(ctx.request.url);

      // Use the access token to make an authenticated API request
      const userResponse = await fetch(urlBase + "connect/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const user = await userResponse.json();
      localStorage.setItem('idToken', tokens.idToken?.toString());
      localStorage.setItem('FrontChannel', "");
      localStorage.setItem('claims', JSON.stringify(user))
      const [header, payload, signature] = decode(tokens.idToken);
      localStorage.setItem('sid', payload.sid);
      ctx.response.body = user;
  }
  else{
    ctx.response.body =  claims;
  }
  
});

router.get("/", (ctx) => {
  let frontChannel = localStorage.getItem('FrontChannel');
  if(frontChannel == null || frontChannel ==undefined)
    frontChannel = '';
  ctx.response.body = 'DENO AND ' +frontChannel;
  localStorage.setItem('FrontChannel', "");
});

router.get("/index", (ctx) => {
  let frontChannel = localStorage.getItem('FrontChannel');
  if(frontChannel == null || frontChannel ==undefined)
    frontChannel = '';
  ctx.response.body = 'DENO AND ' +frontChannel;
  localStorage.setItem('FrontChannel', "");
});

router.get("/Logout",  (ctx) => {
  const idToken = localStorage.getItem('idToken');
  localStorage.setItem('claims', '')
  localStorage.setItem('sid', '')
  localStorage.setItem('FrontChannel', " -- Sesión Cerrada -- ");
  ctx.response.redirect(urlBase + "connect/endsession?id_token_hint="+ idToken +"&post_logout_redirect_uri=" + redirectUriPostLogout);
});
router.get("/FrontChannelLogout",  (ctx) => {
  const sid = ctx.request.url.searchParams.get('sid');
  const iss = ctx.request.url.searchParams.get('iss');
  const sidLogin = localStorage.getItem('sid');
  if(sidLogin == sid){
    localStorage.setItem('claims', '')
    localStorage.setItem('sid', '')
    localStorage.setItem('FrontChannel', " -- Sesión Cerrada -- " + sid +' - '+iss);
  }
  
});

const app = new Application();
app.use(router.allowedMethods(), router.routes());

await app.listen({ port: 8000 });


