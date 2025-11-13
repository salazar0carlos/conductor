'use client';

import * as React from 'react';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={`transition-shadow ${className || ''}`}
    style={{
      backgroundColor: 'var(--conductor-card-background)',
      border: 'var(--conductor-card-border-width) solid var(--conductor-card-border)',
      borderRadius: 'var(--conductor-card-radius)',
      boxShadow: 'var(--conductor-card-shadow)',
      padding: 'var(--conductor-card-padding)',
      color: 'var(--conductor-body-color)',
      ...style
    }}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, style, ...props }, ref) => (
  <h3
    ref={ref}
    className={`leading-none tracking-tight ${className || ''}`}
    style={{
      fontFamily: 'var(--conductor-title-font)',
      fontSize: 'var(--conductor-title-size)',
      fontWeight: 'var(--conductor-title-weight)',
      color: 'var(--conductor-title-color)',
      ...style
    }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, style, ...props }, ref) => (
  <p
    ref={ref}
    className={className || ''}
    style={{
      fontFamily: 'var(--conductor-body-font)',
      fontSize: 'var(--conductor-body-size)',
      color: 'var(--conductor-muted-color)',
      ...style
    }}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-6 pt-0 ${className || ''}`}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
