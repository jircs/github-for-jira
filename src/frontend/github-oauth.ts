/*
 * Copied from https://github.com/maxogden/github-oauth/blob/master/index.js
 * But it had a vulnerability on the `request` package version range.
 * So, instead of making a fork, since it's only one file and the package
 * hasn't been updated in 3 years I thought it was simpler to just copy the source here
 */
// TODO: use Axios instead
import request from 'request';
import crypto from 'crypto';
import * as url from 'url';
import {Express, NextFunction, Request, RequestHandler, Response} from 'express';

const host = process.env.GHE_HOST || 'github.com';

export interface OAuthOptions {
  baseURL: string;
  githubClient: string;
  githubSecret: string;
  loginURI?: string;
  callbackURI?: string;
  scopes?: string[];
}

export interface GithubOAuth {
  addRoutes: (router: Express) => void;
  checkGithubAuth: RequestHandler;
}

export default (opts: OAuthOptions): GithubOAuth => {
  opts.callbackURI = opts.callbackURI || '/github/callback';
  opts.loginURI = opts.loginURI || '/github/login';
  opts.scopes = opts.scopes || ['user', 'repo'];
  const redirectURI = new URL(opts.callbackURI, opts.baseURL).toString();

  function login(req: Request, res: Response, next: NextFunction, redirectUrl?: string): void {
    // TODO: We really should be using an Auth library for this, like @octokit/github-auth
    // Create unique state for each oauth request
    const state = crypto.randomBytes(8).toString('hex');
    // Save the redirect that may have been specified earlier into session to be retrieved later
    req.session[state] = redirectUrl || res.locals.redirect || `/github/configuration${url.parse(req.originalUrl).search || ''}`;
    res.redirect(`https://${host}/login/oauth/authorize?client_id=${opts.githubClient}${opts.scopes.length ? `&scope=${opts.scopes.join(' ')}` : ''}&redirect_uri=${redirectURI}&state=${state}`);
    next();
  }

  function callback(req, res, next): void {
    const {query} = url.parse(req.url, true);
    const code = query.code as string;
    const state = query.state as string;

    // Take save redirect url and delete it from session
    const redirectUrl = req.session[state];
    delete req.session[state];

    // Check if state is available and matches a previous request
    if (!state || !redirectUrl) return next(new Error('Missing matching Auth state parameter'));
    if (!code) return next(new Error('Missing OAuth Code'));

    request.get({
      url: `https://${host}/login/oauth/access_token?client_id=${opts.githubClient}&client_secret=${opts.githubSecret}&code=${code}&state=${state}`,
      json: true,
    }, (err, _, body) => {
      if (err) {
        return next(new Error('Cannot retrieve access token from Github'));
      }
      req.session.githubToken = body.access_token;
      res.redirect(redirectUrl);
      next();
    });
  }

  return {
    addRoutes: (router: Express) => {
      // compatible with flatiron/director
      router.get(opts.loginURI, login);
      router.get(opts.callbackURI, callback);
    },
    checkGithubAuth: (req: Request, res: Response, next: NextFunction) => {
      if (!req.session.githubToken) {
        return login(req, res, next, req.originalUrl);
      }
      return next();
    },
  };
};