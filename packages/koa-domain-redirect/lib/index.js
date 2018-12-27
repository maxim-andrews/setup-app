'use strict';

const DOMAIN_REG_EXP = new RegExp('^(([a-z0-9]+-)*[a-z0-9]+\\.)+([a-z0-9]+-)*[a-z0-9]+$', 'i');

function addToAllowed (allowedArray, targetDomain) {
  if (!DOMAIN_REG_EXP.test(targetDomain) || allowedArray.includes(targetDomain)) {
    return false;
  }

  allowedArray.push(targetDomain);

  return true;
}

function addToDomainMap (domainMap, targetDomain, sourceDomain) {
  if (!DOMAIN_REG_EXP.test(sourceDomain) || domainMap[sourceDomain]) {
    return false;
  }

  domainMap[sourceDomain] = targetDomain;

  return true;
}

exports = module.exports = rdrDomains => {
  const objType = typeof rdrDomains;
  const allowedDomains = [];
  const domainMap = {};
  let defaultDomain;

  if (Array.isArray(rdrDomains)) {
    rdrDomains.forEach(addToAllowed.bind(null, allowedDomains));
  } else if (objType === 'object' && rdrDomains !== null) {
    Object.keys(rdrDomains).forEach(domain => {
      if (!addToAllowed(allowedDomains, domain)) {
        return false;
      }

      if (Array.isArray(rdrDomains[domain])) {
        rdrDomains[domain].forEach(addToDomainMap.bind(null, domainMap, domain));
      } else if (
        typeof rdrDomains[domain] === 'string'
        && !addToDomainMap(domainMap, domain, rdrDomains[domain])
        && rdrDomains[domain] === 'default') {
        defaultDomain = domain;
      }
    });
  } else if (objType === 'string') {
    addToAllowed(allowedDomains, rdrDomains);
  }

  if (allowedDomains.length === 0) {
    throw Error('koa-domain-redirect middleware requires at least one valid domain to be provided for redirection');
  }

  if (!defaultDomain) {
    defaultDomain = allowedDomains[0];
  }

  return async (ctx, next) => {
    if (process.env.NODE_ENV === 'production' && !allowedDomains.includes(ctx.hostname)) {
      let destination;

      if (domainMap[ctx.hostname]) {
        destination = domainMap[ctx.hostname];
      } else {
        destination = defaultDomain;
      }

      // In production we redirect to single domain
      const REDIRECT_URL =
        ctx.origin.replace(ctx.hostname, destination)
        + ctx.href.substring(ctx.origin.length);

      ctx.redirect(REDIRECT_URL);
      ctx.body = 'Redirecting to correct domain';
    } else {
      return next();
    }
  };
};

// exporting for tests only
exports.addToAllowed = module.exports.addToAllowed = addToAllowed;
exports.addToDomainMap = module.exports.addToDomainMap = addToDomainMap;
