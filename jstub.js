if (typeof $ == 'undefined') { $ = {}; }

$.jstub =
{
  containers: {},
  stub: function(object, method, arguments, returnValue)
  {
    if (object == null) { object = window; }      
    var container = $.jstub.containers[object];
    if (container == null) 
    { 
      container = new $.jstub.container(object);
      $.jstub.containers[object] = container;
    }
    container.add(method, arguments, returnValue);
  },
  reset: function()
  {
    for(var container in $.jstub.containers)
    {
      $.jstub.containers[container].reset();
    }
    $.jstub.containers = {};
  }
};

$.jstub.container = function(object)
{
  this.object = object;
  this.stubbers = {};
  this.add = function(method, arguments, returnValue)
  {
    var stubber = this.stubbers[method];
    if (stubber == null)
    {
      stubber = new $.jstub.stubber(this.object, method);
      this.stubbers[method] = stubber;   
      this.object[method] = function()
      {
        var args = Array.prototype.slice.call(arguments);
        return stubber.execute(stubber, args);
      };
    }
    stubber.add(arguments, returnValue);
  };
  this.reset = function()
  {
    for(var stubber in this.stubbers)
    {
      var s = this.stubbers[stubber];
      this.object[s.method] = s.original;
    }
    this.stubbers = {};
  };
};

$.jstub.stubber = function(object, method)
{
  this.method = method;
  this.original = object[method];
  this.expectations = [];
  this.add = function(arguments, returnValue)
  {
    this.expectations.push({arguments: arguments, returnValue: returnValue});
  };
  this.execute = function(stubber, args)
  {   
    for(var i = 0; i < stubber.expectations.length; ++i)
    {
      if ($.jstub.compare(stubber.expectations[i].arguments, args))
      {
        return stubber.expectations[i].returnValue;
      }
    }
		
		//unexpected call, let's build a message		
		var message = 'unexpected call to ' + method + "(";
		for(var i = 0; i < args.length; ++i)
		{
			var arg = typeof args[i] == 'string' ? '"' + args[i] + '"' : args[i];
			message += arg + ', ';
		}
		if (args.length > 0) { message = message.substring(0, message.length - 2); }
		message += ')';
		
		//fail via qunit if its available
		if (window['ok'] != null)  {ok(false, message); }
		else { throw message; }
  }
};

//largely taken from:
//http://www.yoxigen.com/blog/index.php/2010/04/javascript-function-to-deep-compare-json-objects/
$.jstub.compare = function(first, second)
{
 function size(o)
 {
  var size = 0;
  for (var keyName in o)
  {
    if (keyName != null) { size++; }
  }
  return size;
 }

 if (size(first) != size(second)) { return false; }

 for(var keyName in first)
 {
  var value1 = first[keyName];
	var value2 = second[keyName];

	if (typeof value1 != typeof value2) { return false; }
	// For jQuery objects:
	if (value1 && value1.length && (value1[0] !== undefined && value1[0].tagName))
	{
		if(!value2 || value2.length != value1.length || !value2[0].tagName || value2[0].tagName != value1[0].tagName) { return false; }
	}
	else if (typeof value1 == 'function' || typeof value1 == 'object') 
	{
	  if (!compare(value1, value2)) { return false; }
	}
	else if (value1 != value2) {return false; }
 }
 return true;
};

$.stub = $.jstub.stub;
$.resetStubs = $.jstub.reset;