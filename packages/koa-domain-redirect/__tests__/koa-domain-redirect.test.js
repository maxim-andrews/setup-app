'use strict';

const koaDomainRedirect = require('../lib/index.js');
const { addToAllowed, addToDomainMap } = koaDomainRedirect;

const ctx = {
  hostname: 'mydomain.com',
  origin: 'http://mydomain.com',
  href: 'http://mydomain.com/my/cool/address'
};
let next;

describe('koa-domain-redirect unit tests', () => {
  test('adds domain to allowed', () => {
    const allowedDomains = [];
    const domains = [
      'greatdomain.com',
      'greatdomain.com',
      'anotherdomain.com',
      'wrongdomain-.-',
      ''
    ];
    const results = domains.map(addToAllowed.bind(null, allowedDomains));

    expect(results).toEqual([ true, false, true, false, false ]);
    expect(allowedDomains).toEqual([ 'greatdomain.com', 'anotherdomain.com' ]);
  });

  test('adds domain to map', () => {
    const domainMap = {  };
    const domains = {
      'domain1.com': [ 'greatdomain.com', 'dom-aa.me', 'zzz.-me' ],
      'domain2.com': [ 'greatdomain.com', 'azd.aa' ],
      'domain3.com': [ 'anotherdomain.com', '' ],
      'domain4.com': [ 'wrongdomain-.-' ],
      'domain5.com': [ '' ]
    };
    const results = Object.keys(domains).reduce(
      (res, target) =>
        res.concat(
          domains[target].map(addToDomainMap.bind(null, domainMap, target))
        ),
      []
    );

    expect(results).toEqual([ true, true, false, false, true, true, false, false, false ]);
    expect(domainMap).toEqual({
      'greatdomain.com': 'domain1.com',
      'dom-aa.me': 'domain1.com',
      'azd.aa': 'domain2.com',
      'anotherdomain.com': 'domain3.com'
    });
  });
});

describe('koa-domain-redirect strings', () => {
  beforeEach(() => {
    ctx.redirect = jest.fn();
    delete ctx.body;
    next = jest.fn();
  });

  test('skips in non-production', () => {
    const domain = 'greatdomain.com';

    const wrapperFunc = () => {
      koaDomainRedirect(domain)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('redirects on string domain', () => {
    const domain = 'greatdomain.com';

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domain)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, domain) + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('skips on allowed string domain', () => {
    const domain = 'mydomain.com';

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domain)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledWith();

    process.env.NODE_ENV = '';
  });

  test('throws an error with invalid string domain', () => {
    process.env.NODE_ENV = 'production';

    const domain = 'mydomain.-123';

    const wrapperFunc = () => {
      koaDomainRedirect(domain)(ctx, next);
    };

    expect(wrapperFunc).toThrow('middleware requires at least one valid domain');
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('throws an error without domain', () => {
    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect()(ctx, next);
    };

    expect(wrapperFunc).toThrow('middleware requires at least one valid domain');
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });
});

describe('koa-domain-redirect array', () => {
  beforeEach(() => {
    ctx.redirect = jest.fn();
    delete ctx.body;
    next = jest.fn();
  });

  test('redirects on domain in array', () => {
    const domains = [ 'greatdomain.com', 'anotherdomain.com' ];

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domains)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, domains[0]) + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('skips on allowed domain in array', () => {
    const domain = [ 'mydomain.com', 'gooddomain.com' ];

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domain)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledWith();

    process.env.NODE_ENV = '';
  });

  test('throws error with invalid domain in array', () => {
    const domains = [ 'mydomain.-123' ];

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).toThrow('middleware requires at least one valid domain');
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects with one invalid domain in array', () => {
    const domains = [ 'mydomain.-123', 'mycool.domain' ];

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, domains[1]) + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });
});

describe('koa-domain-redirect objects', () => {
  beforeEach(() => {
    ctx.redirect = jest.fn();
    delete ctx.body;
    next = jest.fn();
  });

  test('redirects on domain in object', () => {
    const domains = {
      'greatdomain.com': [ 'mydomain.com', 'yourdomain.com' ],
      'anotherdomain.com': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ]
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domains)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'greatdomain.com') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('skips on allowed domain in object key', () => {
    const domains = {
      'mydomain.com': [ 'greatdomain.com', 'yourdomain.com' ],
      'anotherdomain.com': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ]
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      koaDomainRedirect(domains)(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledWith();

    process.env.NODE_ENV = '';
  });

  test('throws error with invalid domains in object key', () => {
    const domains = {
      'mydomain.-123': [ 'greatdomain.com', 'yourdomain.com' ],
      'anotherdomain.321-': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ]
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).toThrow('middleware requires at least one valid domain');
    expect(ctx.redirect).not.toHaveBeenCalled();
    expect(ctx.body).toBeUndefined();
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects with one invalid domain in keys', () => {
    const domains = {
      'greatdomain.com': [ 'yourdomain.com' ],
      'anotherdomain.321-': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ]
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'greatdomain.com') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects to default', () => {
    const domains = {
      'greatdomain.com': [ 'yourdomain.com', 'somedomain.com' ],
      'anotherdomain.321-': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ],
      'default.domain': 'default'
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'default.domain') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects to first key as default domain is invalid', () => {
    const domains = {
      'greatdomain.com': [ 'yourdomain.com', 'somedomain.com' ],
      'anotherdomain.321-': [ 'yourdads.domain', 'yourmoms.domain', 'yoursis.domain' ],
      'default.-domain': 'default'
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'greatdomain.com') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects to default domain as all provided target domains are invalid', () => {
    const domains = {
      'greatdomain.com': [ '-yourdomain.com', 'somedomain.com-' ],
      'anotherdomain.321': [ 'yourdads.-domain', '-yourmoms.domain', 'yoursis-.domain' ],
      'default.domain': 'default'
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'default.domain') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });

  test('redirects to mapped string domain as all other provided domains are invalid', () => {
    const domains = {
      'greatdomain.com': [ '-yourdomain.com', 'somedomain.com-' ],
      'anotherdomain.321': [ 'yourdads.-domain', '-yourmoms.domain', 'yoursis-.domain' ],
      'anotherdomain.com': 'mydomain.com',
      'default.domain': 'default'
    };

    process.env.NODE_ENV = 'production';

    const wrapperFunc = () => {
      const middleware = koaDomainRedirect(domains);
      middleware(ctx, next);
    };

    expect(wrapperFunc).not.toThrow();
    expect(ctx.redirect).toHaveBeenCalledWith(ctx.origin.replace(ctx.hostname, 'anotherdomain.com') + ctx.href.substring(ctx.origin.length));
    expect(ctx.body).toBe('Redirecting to correct domain');
    expect(next).not.toHaveBeenCalled();

    process.env.NODE_ENV = '';
  });
});
