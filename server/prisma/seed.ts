import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.voiceAnalytics.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log('👥 Creating test users...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@mitr.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'agent@mitr.com',
      passwordHash: userPassword,
      name: 'Sarah Johnson',
      role: 'USER'
    }
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'mike@mitr.com',
      passwordHash: userPassword,
      name: 'Mike Chen',
      role: 'USER'
    }
  });

  // Create user settings
  console.log('⚙️ Creating user settings...');
  
  await prisma.setting.create({
    data: {
      userId: adminUser.id,
      aiEnabled: true,
      notifications: true,
      dataRetentionDays: 365,
      businessName: 'Mitr Support Inc',
      contactEmail: 'support@mitr.com',
      phoneNumber: '+1-800-MITR-SUP',
      websiteUrl: 'https://mitr.com'
    }
  });

  await prisma.setting.create({
    data: {
      userId: regularUser.id,
      aiEnabled: true,
      notifications: true,
      dataRetentionDays: 90,
      businessName: 'Sarah\'s Customer Care',
      contactEmail: 'sarah@mitr.com',
      phoneNumber: '+1-555-SARAH',
      websiteUrl: 'https://sarah-support.mitr.com'
    }
  });

  await prisma.setting.create({
    data: {
      userId: agentUser2.id,
      aiEnabled: false,
      notifications: true,
      dataRetentionDays: 180,
      businessName: 'Mike\'s Tech Support',
      contactEmail: 'mike@mitr.com',
      phoneNumber: '+1-555-MIKEC'
    }
  });

  // Create integrations
  console.log('🔗 Creating integrations...');
  
  const integrations = await prisma.integration.createMany({
    data: [
      {
        userId: adminUser.id,
        provider: 'WHATSAPP',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        userId: adminUser.id,
        provider: 'INSTAGRAM',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        userId: adminUser.id,
        provider: 'VOICE',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        userId: regularUser.id,
        provider: 'WHATSAPP',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
      },
      {
        userId: regularUser.id,
        provider: 'INSTAGRAM',
        status: 'error',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 120) // 2 hours ago
      },
      {
        userId: agentUser2.id,
        provider: 'VOICE',
        status: 'connected',
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
      }
    ]
  });

  // Create subscriptions
  console.log('💳 Creating subscriptions...');
  
  await prisma.subscription.createMany({
    data: [
      {
        userId: adminUser.id,
        plan: 'ENTERPRISE',
        status: 'active',
        queriesUsed: 1250,
        nextBilling: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15) // 15 days from now
      },
      {
        userId: regularUser.id,
        plan: 'PROFESSIONAL',
        status: 'active',
        queriesUsed: 450,
        nextBilling: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8) // 8 days from now
      },
      {
        userId: agentUser2.id,
        plan: 'STARTER',
        status: 'active',
        queriesUsed: 89,
        nextBilling: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22) // 22 days from now
      }
    ]
  });

  // Create test conversations with messages
  console.log('💬 Creating conversations and messages...');

  // WhatsApp Conversation 1 (Admin user)
  const whatsappConv1 = await prisma.conversation.create({
    data: {
      subject: 'Order Status Inquiry',
      channel: 'WHATSAPP',
      status: 'OPEN',
      customerName: 'Emma Thompson',
      customerPhone: '+1234567890',
      userId: adminUser.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: whatsappConv1.id,
        sender: 'CUSTOMER',
        content: 'Hi, I placed an order yesterday but haven\'t received any updates. Can you help?',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        conversationId: whatsappConv1.id,
        sender: 'AI',
        content: 'Hello Emma! I\'d be happy to help you check your order status. Could you please provide me with your order number?',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 30)
      },
      {
        conversationId: whatsappConv1.id,
        sender: 'CUSTOMER',
        content: 'Sure! It\'s #ORD-12345',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 115)
      },
      {
        conversationId: whatsappConv1.id,
        sender: 'AI',
        content: 'Great! I found your order #ORD-12345. It\'s currently being processed and should ship within 24 hours. You\'ll receive a tracking number via email once it\'s dispatched.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 15)
      }
    ]
  });

  // Instagram Conversation (Regular user)
  const instagramConv = await prisma.conversation.create({
    data: {
      subject: 'Product Question',
      channel: 'INSTAGRAM',
      status: 'HUMAN',
      customerName: 'alex_photographer',
      userId: regularUser.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: instagramConv.id,
        sender: 'CUSTOMER',
        content: 'Hey! I saw your camera lens in the latest post. Is it available for rent?',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
      },
      {
        conversationId: instagramConv.id,
        sender: 'AI',
        content: 'Hi Alex! Thanks for your interest in our camera equipment. Let me connect you with one of our specialists who can help with rental inquiries.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4 + 1000 * 45)
      },
      {
        conversationId: instagramConv.id,
        sender: 'HUMAN',
        content: 'Hi Alex! I\'m Sarah from the rental team. Yes, that Canon 85mm lens is available! It\'s $50/day or $200/week. When would you need it?',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 5)
      }
    ]
  });

  // Voice Call Conversation
  const voiceConv = await prisma.conversation.create({
    data: {
      subject: 'Technical Support Call',
      channel: 'VOICE_CALL',
      status: 'RESOLVED',
      customerName: 'Robert Martinez',
      customerPhone: '+1987654321',
      callDuration: 420, // 7 minutes
      userId: agentUser2.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 53) // 53 minutes ago
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: voiceConv.id,
        sender: 'CUSTOMER',
        content: 'Hello, I\'m having trouble connecting my app to the API.',
        messageType: 'AUDIO',
        transcription: 'Hello, I\'m having trouble connecting my app to the API.',
        audioDuration: 4,
        confidence: 0.95,
        createdAt: new Date(Date.now() - 1000 * 60 * 60)
      },
      {
        conversationId: voiceConv.id,
        sender: 'AI',
        content: 'I understand you\'re having API connection issues. Let me transfer you to our technical team.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 59)
      },
      {
        conversationId: voiceConv.id,
        sender: 'HUMAN',
        content: 'Hi Robert, this is Mike from technical support. I can help you with the API connection.',
        messageType: 'AUDIO',
        transcription: 'Hi Robert, this is Mike from technical support. I can help you with the API connection.',
        audioDuration: 5,
        confidence: 0.98,
        createdAt: new Date(Date.now() - 1000 * 60 * 58)
      },
      {
        conversationId: voiceConv.id,
        sender: 'AI',
        content: 'Call Summary: Successfully resolved API connection issue. Customer was missing authentication headers. Provided documentation and tested connection successfully.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 53)
      }
    ]
  });

  // Website Chat Conversation
  const websiteConv = await prisma.conversation.create({
    data: {
      subject: 'Billing Inquiry',
      channel: 'WEBSITE',
      status: 'OPEN',
      customerName: 'Lisa Park',
      userId: regularUser.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
    }
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: websiteConv.id,
        sender: 'CUSTOMER',
        content: 'I was charged twice for my subscription this month. Can you help?',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        conversationId: websiteConv.id,
        sender: 'AI',
        content: 'I\'m sorry to hear about the double charge. Let me check your billing history and resolve this for you right away.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 29)
      },
      {
        conversationId: websiteConv.id,
        sender: 'AI',
        content: 'I can see there was indeed a duplicate charge on your account. I\'ve initiated a refund for the duplicate amount. You should see it in 3-5 business days.',
        messageType: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 2)
      }
    ]
  });

  // More conversations for better test data
  const conversations = [
    {
      subject: 'Product Recommendation',
      channel: 'WHATSAPP' as const,
      status: 'RESOLVED' as const,
      customerName: 'David Kim',
      customerPhone: '+1555123456',
      userId: regularUser.id
    },
    {
      subject: 'Refund Request',
      channel: 'INSTAGRAM' as const,
      status: 'OPEN' as const,
      customerName: 'maria_designs',
      userId: agentUser2.id
    },
    {
      subject: 'Account Setup Help',
      channel: 'WEBSITE' as const,
      status: 'HUMAN' as const,
      customerName: 'John Wilson',
      userId: adminUser.id
    }
  ];

  for (const conv of conversations) {
    const conversation = await prisma.conversation.create({
      data: {
        ...conv,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7), // Random time in last week
        updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 2) // Random time in last 2 hours
      }
    });

    // Add some messages to each conversation
    const messageCount = Math.floor(Math.random() * 5) + 2; // 2-6 messages
    for (let i = 0; i < messageCount; i++) {
      const senders = ['CUSTOMER', 'AI', 'HUMAN'];
      const sender = senders[Math.floor(Math.random() * senders.length)] as 'CUSTOMER' | 'AI' | 'HUMAN';
      
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender,
          content: `Sample message ${i + 1} from ${sender}`,
          messageType: 'TEXT',
          createdAt: new Date(conversation.createdAt.getTime() + i * 1000 * 60 * 10)
        }
      });
    }
  }

  // Create voice call logs
  console.log('📞 Creating voice call logs...');
  
  const callLogs = [
    {
      conversationId: voiceConv.id,
      callId: 'call_1698765432_abc123',
      direction: 'INBOUND' as const,
      phoneNumber: '+1987654321',
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() - 1000 * 60 * 53),
      duration: 420,
      status: 'COMPLETED' as const,
      aiResponseCount: 2,
      escalatedToHuman: true,
      customerSatisfaction: 5
    },
    {
      conversationId: voiceConv.id,
      callId: 'call_1698765433_def456',
      direction: 'OUTBOUND' as const,
      phoneNumber: '+1234567890',
      startTime: new Date(Date.now() - 1000 * 60 * 180),
      endTime: new Date(Date.now() - 1000 * 60 * 175),
      duration: 300,
      status: 'COMPLETED' as const,
      aiResponseCount: 4,
      escalatedToHuman: false,
      customerSatisfaction: 4
    }
  ];

  for (const callLog of callLogs) {
    await prisma.callLog.create({ data: callLog });
  }

  // Create voice analytics
  console.log('📊 Creating voice analytics...');
  
  const voiceAnalyticsData = [];
  
  // Generate analytics for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    for (const user of [adminUser, regularUser, agentUser2]) {
      const totalCalls = Math.floor(Math.random() * 10) + 1;
      const totalDuration = totalCalls * (Math.floor(Math.random() * 300) + 60);
      
      voiceAnalyticsData.push({
        userId: user.id,
        date,
        totalCalls,
        totalDuration,
        averageDuration: Math.floor(totalDuration / totalCalls),
        aiResolutionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        customerSatisfaction: Math.floor(Math.random() * 2) + 3.5, // 3.5-5.5
        costTotal: totalCalls * (Math.floor(Math.random() * 50) + 10) // $0.10-$0.60 per call
      });
    }
  }

  await prisma.voiceAnalytics.createMany({ data: voiceAnalyticsData });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log(`  • ${await prisma.user.count()} users`);
  console.log(`  • ${await prisma.conversation.count()} conversations`);
  console.log(`  • ${await prisma.message.count()} messages`);
  console.log(`  • ${await prisma.setting.count()} settings`);
  console.log(`  • ${await prisma.integration.count()} integrations`);
  console.log(`  • ${await prisma.subscription.count()} subscriptions`);
  console.log(`  • ${await prisma.callLog.count()} call logs`);
  console.log(`  • ${await prisma.voiceAnalytics.count()} voice analytics records`);
  
  console.log('\n👥 Test Users Created:');
  console.log('  • admin@mitr.com (password: admin123) - ADMIN');
  console.log('  • agent@mitr.com (password: user123) - USER');
  console.log('  • mike@mitr.com (password: user123) - USER');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
