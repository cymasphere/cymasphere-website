// This file is specifically used to suppress the useLayoutEffect warning in Next.js

// Used in _app.js to suppress the useLayoutEffect warning
export const suppressLayoutShift = () => {
  if (typeof window === 'undefined') {
    global.HTMLElement = function() {};
    global.HTMLElement.prototype = {};
    
    // Create a mock implementation for useLayoutEffect
    const React = require('react');
    const originalUseLayoutEffect = React.useLayoutEffect;
    React.useLayoutEffect = function(callback, deps) {
      return React.useEffect(callback, deps);
    };
    
    // Keep a reference to the original so it can be restored if needed
    React.useLayoutEffect._original = originalUseLayoutEffect;
  }
}; 