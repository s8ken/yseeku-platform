/**
 * @desc    Create a new trust declaration
 * @route   POST /api/trust
 * @access  Protected
 */
export declare const createTrustDeclaration: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get all trust declarations with filtering and pagination
 * @route   GET /api/trust
 * @access  Protected
 */
export declare const getTrustDeclarations: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get a single trust declaration by ID
 * @route   GET /api/trust/:id
 * @access  Protected
 */
export declare const getTrustDeclarationById: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Update a trust declaration
 * @route   PUT /api/trust/:id
 * @access  Protected
 */
export declare const updateTrustDeclaration: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Delete a trust declaration
 * @route   DELETE /api/trust/:id
 * @access  Protected
 */
export declare const deleteTrustDeclaration: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get trust declarations by agent ID
 * @route   GET /api/trust/agent/:agentId
 * @access  Protected
 */
export declare const getTrustDeclarationsByAgent: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Audit a trust declaration (manual review)
 * @route   POST /api/trust/:id/audit
 * @access  Protected (Admin only)
 */
export declare const auditTrustDeclaration: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * @desc    Get trust analytics and statistics
 * @route   GET /api/trust/analytics
 * @access  Protected
 */
export declare const getTrustAnalytics: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=trust-governance.controller.d.ts.map