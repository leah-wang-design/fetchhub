// Reusable badge style classes
export const badgeStyles = {
  // Workspace badge - default style
  workspaceContainer: "flex items-center gap-2",
  workspaceIcon: "w-3 h-3 text-gray-600 dark:text-gray-400",
  workspaceText: "text-xs font-regular text-gray-600 dark:text-gray-400",
  
  // Badge variants
  primary: "inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white text-sm font-regular rounded-lg",
  secondary: "inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-regular rounded-lg",
  success: "inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-regular rounded-lg",
  warning: "inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm font-regular rounded-lg",
  error: "inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm font-regular rounded-lg",
  
  // Small badge variants
  primarySmall: "inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-xs font-regular rounded",
  secondarySmall: "inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-regular rounded",
  successSmall: "inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-regular rounded",
  warningSmall: "inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-regular rounded",
  errorSmall: "inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-regular rounded",
};

// Helper function to combine badge styles with custom classes
export const getBadgeClass = (variant: keyof typeof badgeStyles, customClasses?: string) => {
  return `${badgeStyles[variant]} ${customClasses || ''}`.trim();
};
