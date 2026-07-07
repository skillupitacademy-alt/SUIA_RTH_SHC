'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DomainTable from '@/components/questions/DomainTable';
import SubjectTable from '@/components/questions/SubjectTable';
import TopicTable from '@/components/questions/TopicTable';
import SubtopicTable from '@/components/questions/SubtopicTable';
import SkillTable from '@/components/questions/SkillTable';
import { HierarchyFactoryWizard } from '@/components/content/HierarchyFactoryWizard';
import { Button } from '@/components/ui/button';
import { Sparkles, FolderTree } from 'lucide-react';
import { useShell } from '../ShellContext';

export default function QuestionsPage() {
  const [activeTab, setActiveTab] = useState('domains');
  const [showFactory, setShowFactory] = useState(false);
  const { setHeaderTitle, setHeaderSubtitle } = useShell();

  useEffect(() => {
    setHeaderTitle('Educational Hierarchy');
    setHeaderSubtitle('Manage domains, subjects, topics, subtopics, and skills');
  }, [setHeaderTitle, setHeaderSubtitle]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Educational Hierarchy</h1>
        </div>
        <Button
          onClick={() => setShowFactory(!showFactory)}
          className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {showFactory ? 'Hide' : 'Show'} Bulk Factory
        </Button>
      </div>

      {/* Factory Wizard */}
      {showFactory && (
        <div className="mb-6">
          <HierarchyFactoryWizard />
        </div>
      )}

      {/* Tabs for Different Entity Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="domains" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Domains
          </TabsTrigger>
          <TabsTrigger value="subjects" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Subjects
          </TabsTrigger>
          <TabsTrigger value="topics" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Topics
          </TabsTrigger>
          <TabsTrigger value="subtopics" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Subtopics
          </TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <DomainTable />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <SubjectTable />
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <TopicTable />
        </TabsContent>

        <TabsContent value="subtopics" className="space-y-4">
          <SubtopicTable />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
