"use strict";
/**
 * Demonstration of Enhanced Conversation Identification
 *
 * This script shows how the new system provides specific quotes,
 * search commands, and location details to help you locate
 * flagged conversations in your manual archive.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateConversationIdentification = demonstrateConversationIdentification;
const resonate_validation_1 = require("./resonate-validation");
async function demonstrateConversationIdentification() {
    console.log('🎯 Enhanced Conversation Identification Demo');
    console.log('='.repeat(50));
    const validationSuite = new resonate_validation_1.ResonateValidationSuite();
    console.log('\n📋 Generating demonstration with sample flagged conversations...\n');
    // Generate demonstration with sample conversations
    const demo = await validationSuite.demonstrateConversationIdentification();
    console.log(demo);
    console.log('\n🔍 Now running actual validation to find real flagged conversations...\n');
    try {
        // Run the actual validation
        const report = await validationSuite.validateAllFeatures();
        const reportText = validationSuite.generateReport(report);
        console.log('✅ Validation completed!');
        console.log('\n📊 Summary:');
        console.log(`- Overall Score: ${(report.overallScore * 100).toFixed(1)}%`);
        console.log(`- Features Tested: ${report.totalFeatures}`);
        console.log(`- Passed: ${report.passedFeatures}`);
        console.log(`- Failed: ${report.failedFeatures}`);
        console.log(`- Partial: ${report.partialFeatures}`);
        // Count total flagged conversations
        const totalFlagged = report.results.reduce((sum, result) => sum + (result.flaggedConversations?.length || 0), 0);
        console.log(`\n🚨 Total Flagged Conversations Found: ${totalFlagged}`);
        if (totalFlagged > 0) {
            console.log('\n📍 To locate these conversations in your manual archive:');
            console.log('1. Look at the detailed report below');
            console.log('2. Copy the search commands for conversations you want to review');
            console.log('3. Run them in your archive directory');
            console.log('4. Use the key quotes to confirm you found the right conversation');
            console.log('\n' + '='.repeat(80));
            console.log('DETAILED VALIDATION REPORT WITH CONVERSATION IDENTIFICATION:');
            console.log('='.repeat(80));
            console.log(reportText);
        }
        // Generate calibration report for manual review
        console.log('\n🔧 Generating calibration report for manual archive review...\n');
        const calibrationReport = await validationSuite.generateCalibrationReport();
        console.log(calibrationReport);
    }
    catch (error) {
        console.error('❌ Error during validation:', error);
        console.log('\n💡 Make sure you have:');
        console.log('- Archive files in the expected location');
        console.log('- Proper file permissions');
        console.log('- Required dependencies installed');
    }
}
// Run the demonstration
if (require.main === module) {
    demonstrateConversationIdentification().catch(console.error);
}
