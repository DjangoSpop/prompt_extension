# List of files to remove
$files = @(
    "FINAL_RECTIFIED_WEEK_TWO_REPORT.docx",
    "FINAL_WEEK_TWO_13_INCIDENTS_COMPLETE.docx",
    "Kuajok FO Internal DSR for 20 Oct 2025.docx",
    "Monthly_Report_2025_09.docx",
    "MovCon-Packing-List (2).xls",
    "OPERATIONAL_MEETING_BRIEF_17OCT2025.docx",
    "QUICKSTART.md",
    "QUICK_SUMMARY_CORRECT_NUMBERS.txt",
    "UNMISS Daily Flight Schedule ACTUAL 14-10-2025.xlsm",
    "UNPOL_Weekly_Report_20250916_to_20250923.docx",
    "WEEKLY_CRIME_ANALYSIS_REPORT_10_16_OCT_2025.docx",
    "Weekly_Report_20250919_to_20250925.docx",
    "weekly_20250923_with_dsr.md",
    "weekly_oct10_16_2025 (1).md",
    "weekly_oct10_16_2025.md",
    "weekly_report_20250919_20250925.md"
)

# Remove each file using git rm
foreach ($file in $files) {
    git rm --cached "$file"
    Remove-Item "$file" -Force -ErrorAction SilentlyContinue
}

Write-Host "All files removed from Git index and local disk."
Write-Host "Run: git commit -m 'Remove confidential files'"
