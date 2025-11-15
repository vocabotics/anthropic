import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (development only)
  await prisma.notification.deleteMany();
  await prisma.usageTracking.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.stateTransition.deleteMany();
  await prisma.aiCall.deleteMany();
  await prisma.traceabilityMatrix.deleteMany();
  await prisma.qualityMetric.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.databaseOperation.deleteMany();
  await prisma.apiEndpoint.deleteMany();
  await prisma.integrationElement.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleaned existing data');

  // Create demo users
  const demoPassword = await bcrypt.hash('demo123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@vocabotics.com',
      passwordHash: demoPassword,
      name: 'Demo User',
      role: 'user',
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@vocabotics.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('✓ Created users:', {
    demo: demoUser.email,
    admin: adminUser.email,
  });

  // Create demo subscription
  await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      plan: 'pro',
      status: 'active',
      billingCycle: 'monthly',
      priceUsd: 49.00,
      maxProjects: 5,
      maxTeamMembers: 3,
      maxAICallsPerMonth: 1000,
    },
  });

  console.log('✓ Created subscriptions');

  // Create demo project
  const demoProject = await prisma.project.create({
    data: {
      ownerId: demoUser.id,
      name: 'E-commerce Platform',
      description: 'Modern e-commerce platform with AI-powered recommendations',
      vision: 'Build a scalable e-commerce platform with product recommendations, real-time inventory, and multi-vendor support',
      status: 'active',
      currentPhase: 'prd_generation',
      tags: ['e-commerce', 'ai', 'saas'],
      technologyStack: {
        frontend: ['React', 'TypeScript', 'Tailwind CSS'],
        backend: ['Node.js', 'Express', 'TypeScript'],
        database: ['PostgreSQL', 'Redis'],
      },
      settings: {
        autoGenerateTests: true,
        enforceISO9001: true,
        enforceISO12207: true,
        targetTestCoverage: 95,
        qualityThreshold: 90,
      },
    },
  });

  console.log('✓ Created demo project:', demoProject.name);

  // Create demo artifact (PRD)
  await prisma.artifact.create({
    data: {
      projectId: demoProject.id,
      type: 'prd',
      version: '1.0',
      name: 'E-commerce Platform PRD',
      description: 'Product Requirements Document',
      content: {
        title: 'E-commerce Platform',
        vision: 'Build a modern e-commerce platform',
        requirements: [
          {
            id: 'REQ-001',
            type: 'functional',
            priority: 'critical',
            description: 'User authentication and authorization',
          },
          {
            id: 'REQ-002',
            type: 'functional',
            priority: 'high',
            description: 'Product catalog with search and filters',
          },
        ],
      },
      generatedBy: 'sonnet-4.5',
      generationTimeMs: 12000,
      status: 'approved',
      approvedBy: demoUser.id,
      approvedAt: new Date(),
    },
  });

  console.log('✓ Created demo artifacts');

  // Create AI call record
  await prisma.aiCall.create({
    data: {
      projectId: demoProject.id,
      userId: demoUser.id,
      model: 'sonnet-4.5',
      taskType: 'prd_generation',
      phase: 'prd_generation',
      promptTokens: 500,
      completionTokens: 2000,
      totalTokens: 2500,
      costUsd: 0.075,
      durationMs: 12000,
      cached: false,
      generationQualityScore: 98.5,
    },
  });

  console.log('✓ Created AI usage records');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Email: demo@vocabotics.com');
  console.log('  Password: demo123\n');
  console.log('Admin credentials:');
  console.log('  Email: admin@vocabotics.com');
  console.log('  Password: admin123\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
