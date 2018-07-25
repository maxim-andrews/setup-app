import WebSocket from 'ws';
import ip6addr from 'ip6addr';
import HotClientPlugin from '../HotClientPlugin';

// Disable Websocket server
HotClientPlugin.prototype.runServer = jest.fn();

describe('HotClientPlugin', () => {
  test('Constructor default options test', () => {
    const hotClientPlugin = new HotClientPlugin();

    expect(hotClientPlugin.https).toBe(false);
    expect(hotClientPlugin.host).toBe('0.0.0.0');
    expect(hotClientPlugin.port).toBe(8081);
    expect(hotClientPlugin.hotClient).toBe(require.resolve('../HotClient'));
    expect(hotClientPlugin.hmr).toBeUndefined();
    expect(hotClientPlugin.errors).toBe(true);
    expect(hotClientPlugin.warnings).toBe(true);
    expect(hotClientPlugin.editor).toEqual({ allowedIPs: '127.0.0.1' });
    expect(hotClientPlugin.staticContent).toBe(false);
  });

  describe('newEntry method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
    });

    test('with string argument', () => {
      hotClientPlugin.combineEntry = jest.fn();
      hotClientPlugin.newEntry('newEntry');
      expect(hotClientPlugin.combineEntry).toHaveBeenCalled();
    });

    test('with array argument', () => {
      hotClientPlugin.combineEntry = jest.fn();
      hotClientPlugin.newEntry('newEntry');
      expect(hotClientPlugin.combineEntry).toHaveBeenCalled();
    });

    test('with function argument', () => {
      hotClientPlugin.combineEntry = jest.fn();
      const newEntryFn = hotClientPlugin.newEntry(jest.fn());
      expect(hotClientPlugin.combineEntry).not.toHaveBeenCalled();
      newEntryFn();
      expect(hotClientPlugin.combineEntry).toHaveBeenCalled();
    });
  });

  describe('combineEntry method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
    });

    test('with string argument', () => {
      const myEntry = 'this is my entry';
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      expect(newEntry).toEqual([hotClientPlugin.hotClient, myEntry]);
    });

    test('with array argument', () => {
      const myEntry = ['this is my entry'];
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.unshift(hotClientPlugin.hotClient);
      expect(newEntry).toEqual(myEntry);
    });

    test('with array argument and polyfills entry at the beginning', () => {
      const myEntry = ['polyfills', 'this is my entry'];
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.splice(1, 0, hotClientPlugin.hotClient);
      expect(newEntry).toEqual(myEntry);
    });

    test('with array argument and polyfills entry at the end', () => {
      const myEntry = ['this is my entry', 'polyfills'];
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.push(hotClientPlugin.hotClient);
      expect(newEntry).toEqual(myEntry);
    });

    test('with array argument and polyfills entry in the middle', () => {
      const myEntry = ['this is my entry', 'polyfills', 'this is my another entry'];
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.splice(2, 0, hotClientPlugin.hotClient);
      expect(newEntry).toEqual(myEntry);
    });

    test('with array argument and multiple polyfills entries', () => {
      const myEntry = ['polyfills', 'this is my entry', 'polyfills', 'this is my another entry'];
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.splice(3, 0, hotClientPlugin.hotClient);
      expect(newEntry).toEqual(myEntry);
    });

    test('with object argument', () => {
      const myEntry = { someKey: 'coolValue' };
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.hotClient = hotClientPlugin.hotClient;
      expect(newEntry).toEqual(myEntry);
    });

    test('with object argument and \'hotClient\' property exists', () => {
      const myEntry = {
        someKey: 'coolValue',
        hotClient: 'exists',
        hotClient1: 'exists',
        hotClient2: 'exists',
        hotClient3: 'exists',
        hotClient4: 'exists',
        hotClient5: 'exists',
        anotherKey: 'evenCoolerValue'
      };
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      myEntry.hotClient6 = hotClientPlugin.hotClient;
      expect(newEntry).toEqual(myEntry);
    });

    test('with other type of argument', () => {
      const myEntry = 10;
      const newEntry = hotClientPlugin.combineEntry(myEntry);
      expect(newEntry).toBe(myEntry);
    });

  });

  describe('sendStats to single client', () => {
    let oldMethod, hotClientPlugin;

    beforeEach(() => {
      oldMethod = HotClientPlugin.propagate;
      HotClientPlugin.propagate = jest.fn();
      hotClientPlugin = new HotClientPlugin();
    });

    afterEach(() => {
      HotClientPlugin.propagate = oldMethod;
    });

    test('having errors', () => {
      hotClientPlugin.compilerStats = { errors: ['','','',''] };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).toHaveBeenCalledWith({ }, 'errors', hotClientPlugin.compilerStats.errors);
    });

    test('having errors but set to ignore them', () => {
      hotClientPlugin.errors = false;
      hotClientPlugin.compilerStats = { errors: ['','','',''] };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).not.toHaveBeenCalled();
    });

    test('having assets unchanged', () => {
      hotClientPlugin.compilerStats = { assets: [{},{},{},{}] };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).toHaveBeenCalledWith({ }, 'still-ok');
    });

    test('having warnings', () => {
      hotClientPlugin.compilerStats = { warnings: ['','','',''], hash: 'aaa' };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(1, { }, 'hash', hotClientPlugin.compilerStats.hash);
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(2, { }, 'warnings', hotClientPlugin.compilerStats.warnings);
    });

    test('having warnings but set to ignore them', () => {
      hotClientPlugin.warnings = false;
      hotClientPlugin.compilerStats = { warnings: ['','','',''], hash: 'aaa' };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(1, { }, 'hash', hotClientPlugin.compilerStats.hash);
      expect(HotClientPlugin.propagate).toHaveBeenCalledTimes(1);
    });

    test('without errors and warnings', () => {
      hotClientPlugin.compilerStats = { hash: 'aaa' };
      hotClientPlugin.sendStats({ });
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(1, { }, 'hash', hotClientPlugin.compilerStats.hash);
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(2, { }, 'ok');
    });
  });

  describe('sendStats to all clients', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
      hotClientPlugin.propagateAll = jest.fn();
    });

    test('having errors', () => {
      hotClientPlugin.compilerStats = { errors: ['','','',''] };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).toHaveBeenCalledWith('errors', hotClientPlugin.compilerStats.errors);
    });

    test('having errors but set to ignore them', () => {
      hotClientPlugin.errors = false;
      hotClientPlugin.compilerStats = { errors: ['','','',''] };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).not.toHaveBeenCalled();
    });

    test('having assets unchanged', () => {
      hotClientPlugin.compilerStats = { assets: [{},{},{},{}] };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).toHaveBeenCalledWith('still-ok');
    });

    test('having warnings', () => {
      hotClientPlugin.compilerStats = { warnings: ['','','',''], hash: 'aaa' };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).toHaveBeenNthCalledWith(1, 'hash', hotClientPlugin.compilerStats.hash);
      expect(hotClientPlugin.propagateAll).toHaveBeenNthCalledWith(2, 'warnings', hotClientPlugin.compilerStats.warnings);
    });

    test('having warnings but set to ignore them', () => {
      hotClientPlugin.warnings = false;
      hotClientPlugin.compilerStats = { warnings: ['','','',''], hash: 'aaa' };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).toHaveBeenNthCalledWith(1, 'hash', hotClientPlugin.compilerStats.hash);
      expect(hotClientPlugin.propagateAll).toHaveBeenCalledTimes(1);
    });

    test('without errors and warnings', () => {
      hotClientPlugin.compilerStats = { hash: 'aaa' };
      hotClientPlugin.sendStats();
      expect(hotClientPlugin.propagateAll).toHaveBeenNthCalledWith(1, 'hash', hotClientPlugin.compilerStats.hash);
      expect(hotClientPlugin.propagateAll).toHaveBeenNthCalledWith(2, 'ok');
    });
  });

  describe('propagateAll method', () => {
    let oldMethod, hotClientPlugin;

    beforeEach(() => {
      oldMethod = HotClientPlugin.propagate;
      HotClientPlugin.propagate = jest.fn();
      hotClientPlugin = new HotClientPlugin();
      hotClientPlugin.server = {
        clients: [
          { readyState: WebSocket.OPEN },
          { readyState: WebSocket.CONNECTING },
          { readyState: WebSocket.OPEN },
          { readyState: WebSocket.CLOSING },
          { readyState: WebSocket.OPEN },
          { readyState: WebSocket.CLOSED },
          { readyState: WebSocket.OPEN },
          { readyState: WebSocket.CLOSING },
          { readyState: WebSocket.OPEN }
        ]
      };
    });

    afterEach(() => {
      HotClientPlugin.propagate = oldMethod;
    });

    test('to all', () => {
      const clients = hotClientPlugin.server.clients;
      hotClientPlugin.propagateAll('none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(1, clients[0], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(2, clients[2], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(3, clients[4], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(4, clients[6], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(5, clients[8], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenCalledTimes(5)
    });

    test('to all but one', () => {
      const clients = hotClientPlugin.server.clients;
      hotClientPlugin.propagateAll('none', 'some data', clients[4]);
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(1, clients[0], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(2, clients[2], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(3, clients[6], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenNthCalledWith(4, clients[8], 'none', 'some data');
      expect(HotClientPlugin.propagate).toHaveBeenCalledTimes(4)
    });
  });

  test('propagate method', () => {
    const client = { send: jest.fn() };
    const type = 'test';
    const data = 'another data';

    HotClientPlugin.propagate(client, type, data);

    expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type, data }));
  });

  describe('validateEditorIPs method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
    });

    test('with null param', () => {
      hotClientPlugin.editor.allowedIPs = null;

      function validateEditorIPs() {
        hotClientPlugin.validateEditorIPs(null);
      }

      expect(validateEditorIPs).toThrow(/^Configuration option editor\.allowedIPs should be <string>, <array> or not null <object>$/);
    });

    test('with any', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = jest.fn(ips => hotClientPlugin.validateEditorIPs(ips));

      validateEditorIPs('any');

      expect(validateEditorIPs).toHaveReturnedWith(true);
    });

    test('with any through property', () => {
      hotClientPlugin.editor.allowedIPs = 'any';
      const validateEditorIPs = jest.fn(() => hotClientPlugin.validateEditorIPs());

      validateEditorIPs();

      expect(validateEditorIPs).toHaveReturnedWith(true);
    });

    test('with invalid IP as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs('zzz');

      expect(validateEditorIPs).toThrow(/should be valid IPv4 or IPv6 address or CIDR or reserved word 'any'/);
    });

    test('with invalid IP through property', () => {
      hotClientPlugin.editor.allowedIPs = 'zzz';
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/should be valid IPv4 or IPv6 address or CIDR or reserved word 'any'/);
    });

    test('with valid IPv4 and invalid bitmask as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs('192.168.0.1/-5');

      expect(validateEditorIPs).toThrow(/Bit mask of the network should be an integer between 1 and 32 for IPv4 address or between 1 and 128 for IPv6 address\./);
    });

    test('with valid IPv4 and invalid bitmask through property', () => {
      hotClientPlugin.editor.allowedIPs = '192.168.0.1/35';
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/Bit mask of the network should be an integer between 1 and 32 for IPv4 address or between 1 and 128 for IPv6 address\./);
    });

    test('with valid IPv6 and invalid bitmask as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs('::ffff:c0a8:0001/150');

      expect(validateEditorIPs).toThrow(/Bit mask of the network should be an integer between 1 and 32 for IPv4 address or between 1 and 128 for IPv6 address\./);
    });

    test('with valid IPv6 and invalid bitmask through property', () => {
      hotClientPlugin.editor.allowedIPs = '::ffff:c0a8:0001/-10';
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/Bit mask of the network should be an integer between 1 and 32 for IPv4 address or between 1 and 128 for IPv6 address\./);
    });

    test('with invalid range object as param', () => {
      hotClientPlugin.editor.allowedIPs = 'any';
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs({ });

      expect(validateEditorIPs).toThrow(/An object property 'first' should be valid IPv4 or IPv6 address\./);
    });

    test('with invalid range object  through property', () => {
      hotClientPlugin.editor.allowedIPs = { };
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/An object property 'first' should be valid IPv4 or IPv6 address\./);
    });

    test('with invalid range object with first IPv4 and second IPv6 as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs({ first: '192.168.0.1', last: '::ffff:c0a8:0001' });

      expect(validateEditorIPs).toThrow(/An object property 'last' should be valid IPv4 or IPv6 address matching the type of address in property 'first'\./);
    });

    test('with invalid range object with first IPv4 and second IPv6 through property', () => {
      hotClientPlugin.editor.allowedIPs = { first: '192.168.0.1', last: '::ffff:c0a8:0001' };
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/An object property 'last' should be valid IPv4 or IPv6 address matching the type of address in property 'first'\./);
    });

    test('with invalid range object with first greater IPv4 and second smaller IPv4 as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs({ first: '192.168.0.125', last: '192.168.0.3' });

      expect(validateEditorIPs).toThrow(/An object property 'first' should have IP addrress which comes before IP address in object property 'last'\./);
    });

    test('with invalid range object with first greater IPv4 and second smaller IPv4 through property', () => {
      hotClientPlugin.editor.allowedIPs = { first: '192.168.0.125', last: '192.168.0.3' };
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/An object property 'first' should have IP addrress which comes before IP address in object property 'last'\./);
    });

    test('with invalid range object with first greater IPv6 and second smaller IPv6 as param', () => {
      hotClientPlugin.editor.allowedIPs = {};
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs({ first: '::ffff:c0a8:8351', last: '::ffff:c0a8:0023' });

      expect(validateEditorIPs).toThrow(/An object property 'first' should have IP addrress which comes before IP address in object property 'last'\./);
    });

    test('with invalid range object with first greater IPv6 and second smaller IPv6 through property', () => {
      hotClientPlugin.editor.allowedIPs = { first: '::ffff:c0a8:8351', last: '::ffff:c0a8:0023' };
      const validateEditorIPs = () => hotClientPlugin.validateEditorIPs();

      expect(validateEditorIPs).toThrow(/An object property 'first' should have IP addrress which comes before IP address in object property 'last'\./);
    });
  });

  describe('preapareEditorIPs method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
      hotClientPlugin.addEditorIPRange = jest.fn();
    });

    test('with object as param', () => {
      const myObj = { first: '192.168.1.125', last: '192.168.2.35' };
      hotClientPlugin.preapareEditorIPs(myObj);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith(myObj);
    });

    test('with object as property', () => {
      const myObj = { first: '::ffff:c0a8:0001', last: '::ffff:c0a8:ffff' };
      hotClientPlugin.editor.allowedIPs = myObj;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith(myObj);
    });

    test('with string \'any\' as param', () => {
      const str = 'any';
      hotClientPlugin.preapareEditorIPs(str);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::', last: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' });
    });

    test('with string \'any\' as property', () => {
      const str = 'any';
      hotClientPlugin.editor.allowedIPs = str;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::', last: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff' });
    });

    test('with string IPv4 as param', () => {
      const str = '127.0.0.1';
      hotClientPlugin.preapareEditorIPs(str);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '127.0.0.1', last: '127.0.0.1' });
    });

    test('with string IPv4 as property', () => {
      const str = '127.0.0.1';
      hotClientPlugin.editor.allowedIPs = str;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '127.0.0.1', last: '127.0.0.1' });
    });

    test('with string IPv6 as param', () => {
      const str = '::ffff:c0a8:f23';
      hotClientPlugin.preapareEditorIPs(str);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::ffff:c0a8:f23', last: '::ffff:c0a8:f23' });
    });

    test('with string IPv6 as property', () => {
      const str = '::ffff:c0a8:f23';
      hotClientPlugin.editor.allowedIPs = str;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::ffff:c0a8:f23', last: '::ffff:c0a8:f23' });
    });

    test('with string IPv4 CIDR as param', () => {
      const str = '127.0.0.1/8';
      hotClientPlugin.preapareEditorIPs(str);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '127.0.0.1', last: '127.255.255.254' });
    });

    test('with string IPv4 CIDR as property', () => {
      const str = '127.0.0.1/8';
      hotClientPlugin.editor.allowedIPs = str;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '127.0.0.1', last: '127.255.255.254' });
    });

    test('with string IPv6 CIDR as param', () => {
      const str = '::ffff:c0a8:f23/96';
      hotClientPlugin.preapareEditorIPs(str);
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::ffff:0:1', last: '::ffff:ffff:ffff' });
    });

    test('with string IPv6 CIDR as property', () => {
      const str = '::ffff:c0a8:f23/96';
      hotClientPlugin.editor.allowedIPs = str;
      hotClientPlugin.preapareEditorIPs();
      expect(hotClientPlugin.addEditorIPRange).toHaveBeenCalledWith({ first: '::ffff:0:1', last: '::ffff:ffff:ffff' });
    });
  });

  describe('addEditorIPRange method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
    });

    test('called once', () => {
      const ipRange = { first: '127.0.0.1', last: '127.0.0.255' };

      hotClientPlugin.addEditorIPRange(ipRange);

      expect(hotClientPlugin.editorIPRanges[0]).toEqual({
        ...ipRange,
        range: ip6addr.createAddrRange( ipRange.first, ipRange.last )
      });
      expect(hotClientPlugin.editorIPRanges.length).toBe(1);
    });

    test('called twice with overlapping ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.55' };
      const ipRange2 = { first: '127.0.0.31', last: '127.0.0.255' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);

      expect(hotClientPlugin.editorIPRanges[0]).toEqual({
        ...ipRange1,
        last: ipRange2.last,
        range: ip6addr.createAddrRange( ipRange1.first, ipRange2.last )
      });
      expect(hotClientPlugin.editorIPRanges.length).toBe(1);
    });

    test('called tripple with overlapping ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.55' };
      const ipRange2 = { first: '192.168.0.31', last: '192.168.1.82' };
      const ipRange3 = { first: '192.168.0.55', last: '192.168.0.82' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      expect(hotClientPlugin.editorIPRanges[0]).toEqual({
        ...ipRange1,
        range: ip6addr.createAddrRange( ipRange1.first, ipRange1.last )
      });
      expect(hotClientPlugin.editorIPRanges[1]).toEqual({
        ...ipRange2,
        range: ip6addr.createAddrRange( ipRange2.first, ipRange2.last )
      });
      expect(hotClientPlugin.editorIPRanges.length).toBe(2);
    });

    test('called tripple with non-overlapping ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.55' };
      const ipRange2 = { first: '192.168.0.31', last: '192.168.1.82' };
      const ipRange3 = { first: '172.192.0.55', last: '172.192.0.82' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      expect(hotClientPlugin.editorIPRanges[0]).toEqual({
        ...ipRange1,
        range: ip6addr.createAddrRange( ipRange1.first, ipRange1.last )
      });
      expect(hotClientPlugin.editorIPRanges[1]).toEqual({
        ...ipRange2,
        range: ip6addr.createAddrRange( ipRange2.first, ipRange2.last )
      });
      expect(hotClientPlugin.editorIPRanges[2]).toEqual({
        ...ipRange3,
        range: ip6addr.createAddrRange( ipRange3.first, ipRange3.last )
      });
      expect(hotClientPlugin.editorIPRanges.length).toBe(3);
    });

    test('called tripple with last inclusive previous range', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.55' };
      const ipRange2 = { first: '192.168.0.31', last: '192.168.1.82' };
      const ipRange3 = { first: '192.168.0.25', last: '192.168.3.23' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      expect(hotClientPlugin.editorIPRanges[0]).toEqual({
        ...ipRange1,
        range: ip6addr.createAddrRange( ipRange1.first, ipRange1.last )
      });
      expect(hotClientPlugin.editorIPRanges[1]).toEqual({
        ...ipRange3,
        range: ip6addr.createAddrRange( ipRange3.first, ipRange3.last )
      });
      expect(hotClientPlugin.editorIPRanges.length).toBe(2);
    });
  });

  describe('editorIPAllowed method', () => {
    let hotClientPlugin, ipAllowed;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
      hotClientPlugin.editorIPRanges = [];
      ipAllowed = jest.fn((ip) => hotClientPlugin.editorIPAllowed(ip));
    });

    test('with IPv4 from the range', () => {
      const ipRange = { first: '127.0.0.1', last: '127.0.0.255' };

      hotClientPlugin.addEditorIPRange(ipRange);

      ipAllowed('127.0.0.38');

      expect(ipAllowed).toHaveReturnedWith(true);
      expect(hotClientPlugin.editorIPRanges.length).toBe(1);
    });

    test('with IPv6 from the range', () => {
      const ipRange = { first: '::ffff:c0a8:1', last: '::ffff:c0a8:ffff' };

      hotClientPlugin.addEditorIPRange(ipRange);

      ipAllowed('::ffff:c0a8:f1');

      expect(ipAllowed).toHaveReturnedWith(true);
      expect(hotClientPlugin.editorIPRanges.length).toBe(1);
    });

    test('with IPv4 from the mixed ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.255' };
      const ipRange2 = { first: '::ffff:c0a8:1', last: '::ffff:c0a8:ffff' };
      const ipRange3 = { first: '172.168.0.25', last: '172.168.1.1' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      ipAllowed('192.168.0.88');

      expect(ipAllowed).toHaveReturnedWith(true);
      expect(hotClientPlugin.editorIPRanges.length).toBe(3);
    });

    test('with IPv6 from the mixed ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.255' };
      const ipRange2 = { first: '::ffff:c0a8:1', last: '::ffff:c0a8:ffff' };
      const ipRange3 = { first: '172.168.0.25', last: '172.168.1.1' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      ipAllowed('::ffff:c0a8:f21');

      expect(ipAllowed).toHaveReturnedWith(true);
      expect(hotClientPlugin.editorIPRanges.length).toBe(3);
    });

    test('with IPv4 from out of the mixed ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.255' };
      const ipRange2 = { first: '::ffff:c0a8:1', last: '::ffff:c0a8:ffff' };
      const ipRange3 = { first: '172.168.0.25', last: '172.168.1.1' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      ipAllowed('10.168.0.88');

      expect(ipAllowed).toHaveReturnedWith(false);
      expect(hotClientPlugin.editorIPRanges.length).toBe(3);
    });

    test('with IPv6 from out of the mixed ranges', () => {
      const ipRange1 = { first: '127.0.0.1', last: '127.0.0.255' };
      const ipRange2 = { first: '::ffff:c0a8:1', last: '::ffff:c0a8:ffff' };
      const ipRange3 = { first: '172.168.0.25', last: '172.168.1.1' };

      hotClientPlugin.addEditorIPRange(ipRange1);
      hotClientPlugin.addEditorIPRange(ipRange2);
      hotClientPlugin.addEditorIPRange(ipRange3);

      ipAllowed('::ffff:cfa9:f21');

      expect(ipAllowed).toHaveReturnedWith(false);
      expect(hotClientPlugin.editorIPRanges.length).toBe(3);
    });
  });

  describe('apply method', () => {
    let hotClientPlugin;

    beforeEach(() => {
      hotClientPlugin = new HotClientPlugin();
    });

    test('without watch', () => {
      const compiler = { options: { } };

      const callApply = jest.fn(() => hotClientPlugin.apply(compiler));

      expect(callApply).toThrow(/HotClientPlugin should be configured in `watch` only mode\. Configuration option `watch` should be equal to `true`\./);
    });

    test('watching', () => {
      const compiler = {
        options: { watch: true },
        hooks: {
          afterPlugins: { tap: jest.fn() },
          compile:  { tap: jest.fn() },
          invalid: { tap: jest.fn() },
          done: { tap: jest.fn() }
        }
      };

      hotClientPlugin.newEntry = jest.fn();
      hotClientPlugin.apply(compiler);

      expect(hotClientPlugin.newEntry).toHaveBeenCalledWith(undefined);
      expect(compiler.hooks.afterPlugins.tap).toHaveBeenCalled();
      expect(compiler.hooks.compile.tap).toHaveBeenCalled();
      expect(compiler.hooks.invalid.tap).toHaveBeenCalled();
      expect(compiler.hooks.done.tap).toHaveBeenCalled();
    });
  });
});
