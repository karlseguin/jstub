if (typeof $ == 'undefined') { $ = {}; }

$.jstub =
{
  containers: {},
	any: '__jstub__any',  //wow this sucks!
	anyAll: '__jstub__anyAll', //ditto
  stub: function(object, method, arguments, returnValue, callbackIndex, callbackName)
  {
    if (object == null) { object = window; }      
    var container = $.jstub.containers[object];
    if (container == null) 
    { 
      container = new $.jstub.container(object);
      $.jstub.containers[object] = container;
    }
   	return container.add(method, arguments, returnValue, callbackIndex, callbackName);
  },
  reset: function()
  {
    for(var container in $.jstub.containers)
    {
      $.jstub.containers[container].reset();
    }
    $.jstub.containers = {};
  },
};

$.jstub.container = function(object)
{
  this.object = object;
  this.stubbers = {};
  this.add = function(method, arguments, returnValue, callbackIndex, callbackName)
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
    return stubber.add(arguments, returnValue, callbackIndex, callbackName);
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
  this.add = function(arguments, returnValue, callbackIndex, callbackName)
  {
		if(arguments == null) { arguments = []; }
		if (typeof arguments == 'string' || typeof arguments.length == 'undefined'	) { arguments = [arguments]; }
		var expectation = 
		{
			arguments: arguments, 
			returnValue: returnValue, 
			callbackIndex: callbackIndex, 
			callbackName: callbackName,
			invoked: 0
		};
    this.expectations.push(expectation);
		return expectation;
  };
  this.execute = function(stubber, args)
  {   
    for(var i = 0; i < stubber.expectations.length; ++i)
    {
			var expectation = stubber.expectations[i];
      if ($.jstub.compare(expectation.arguments, args))
      {
				expectation.invoked += 1;
				if (expectation.callbackIndex != null)
				{
					var parameters = expectation.returnValue;
					if (parameters == null) { parameters = []; }
					if (typeof parameters == 'string' || typeof parameters.length == 'undefined' ) { parameters = [parameters]; }
					
					var arg = args[expectation.callbackIndex];
					if (expectation.callbackName != null)
					{
						arg[expectation.callbackName].apply(window, parameters);
					}
					else
					{
						arg.apply(window, parameters);
					}
					return true;
				}
				else
				{
        	return expectation.returnValue;
				}
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
$.jstub.compare = function(expected, actual)
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

	if (expected[0] == $.jstub.anyAll) { return true; }
 	if (size(expected) != size(actual)) { return false; }

 	for(var keyName in expected)
 	{
  	var value1 = expected[keyName];
		var value2 = actual[keyName];

		if (value1 == $.jstub.any) { continue; }
		if (typeof value1 != typeof value2) { return false; }
		// For jQuery objects:
		if (value1 && value1.length && (value1[0] !== undefined && value1[0].tagName))
		{
			if(!value2 || value2.length != value1.length || !value2[0].tagName || value2[0].tagName != value1[0].tagName) { return false; }
		}
		else if (typeof value1 == 'function' || typeof value1 == 'object') 
		{
	  	if (!$.jstub.compare(value1, value2)) { return false; }
		}
		else if (value1 != value2) {return false; }
 	}
 	return true;
};

$.stub = $.jstub.stub;
$.resetStubs = $.jstub.reset;