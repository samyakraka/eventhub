import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import type { GalaInvitee, GalaPerformer, GalaProgramItem } from '@/types';
import { db } from '@/lib/firebase';

// Add GalaAdminPanelProps type if missing
interface GalaAdminPanelProps {
  event: any;
  onEventUpdated?: () => void;
}

export default function GalaAdminPanel({ event, onEventUpdated }: GalaAdminPanelProps) {
  const [galaInvitees, setGalaInvitees] = useState<GalaInvitee[]>(event.invitees || []);
  const [galaPerformers, setGalaPerformers] = useState<GalaPerformer[]>(event.performers || []);
  const [galaProgram, setGalaProgram] = useState<GalaProgramItem[]>(event.programSchedule || []);

  // Invitee form state
  const [newInviteeName, setNewInviteeName] = useState('');
  const [newInviteeEmail, setNewInviteeEmail] = useState('');
  const [newInviteeVIP, setNewInviteeVIP] = useState(false);

  // Performer form state
  const [newPerformerName, setNewPerformerName] = useState('');
  const [newPerformerRole, setNewPerformerRole] = useState('');
  const [newPerformerBio, setNewPerformerBio] = useState('');
  const [newPerformerPhoto, setNewPerformerPhoto] = useState('');

  // Program form state
  const [newProgramTime, setNewProgramTime] = useState('');
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramDesc, setNewProgramDesc] = useState('');

  // Invitee handlers
  const addInvitee = async () => {
    if (!newInviteeName || !newInviteeEmail) return;
    const updated = [...galaInvitees, { name: newInviteeName, email: newInviteeEmail, isVIP: newInviteeVIP }];
    setGalaInvitees(updated);
    setNewInviteeName('');
    setNewInviteeEmail('');
    setNewInviteeVIP(false);
    await saveField('invitees', updated);
  };
  const removeInvitee = async (email: string) => {
    const updated = galaInvitees.filter((i) => i.email !== email);
    setGalaInvitees(updated);
    await saveField('invitees', updated);
  };

  // Performer handlers
  const addPerformer = async () => {
    if (!newPerformerName) return;
    const updated = [...galaPerformers, { name: newPerformerName, role: newPerformerRole, bio: newPerformerBio, photoUrl: newPerformerPhoto }];
    setGalaPerformers(updated);
    setNewPerformerName('');
    setNewPerformerRole('');
    setNewPerformerBio('');
    setNewPerformerPhoto('');
    await saveField('performers', updated);
  };
  const removePerformer = async (name: string) => {
    const updated = galaPerformers.filter((p) => p.name !== name);
    setGalaPerformers(updated);
    await saveField('performers', updated);
  };

  // Program handlers
  const addProgramItem = async () => {
    if (!newProgramTime || !newProgramTitle) return;
    const updated = [...galaProgram, { time: newProgramTime, title: newProgramTitle, description: newProgramDesc }];
    setGalaProgram(updated);
    setNewProgramTime('');
    setNewProgramTitle('');
    setNewProgramDesc('');
    await saveField('programSchedule', updated);
  };
  const removeProgramItem = async (title: string) => {
    const updated = galaProgram.filter((p) => p.title !== title);
    setGalaProgram(updated);
    await saveField('programSchedule', updated);
  };

  // Save field helper
  const saveField = async (field: string, value: any) => {
    await updateDoc(doc(db, 'events', event.id), { [field]: value });
    onEventUpdated && onEventUpdated();
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Invitees */}
      <div>
        <h4 className="font-semibold mb-2">Invitees</h4>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Name"
            value={newInviteeName}
            onChange={(e) => setNewInviteeName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={newInviteeEmail}
            onChange={(e) => setNewInviteeEmail(e.target.value)}
          />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={newInviteeVIP} onChange={(e) => setNewInviteeVIP(e.target.checked)} /> VIP
          </label>
          <Button onClick={addInvitee}>Add Invitee</Button>
        </div>
        <ul>
          {galaInvitees.map((invitee) => (
            <li key={invitee.email} className="mb-1 flex items-center gap-2">
              <span>{invitee.name} ({invitee.email}) {invitee.isVIP && <span className="text-yellow-600 font-bold">VIP</span>}</span>
              <Button size="sm" variant="destructive" onClick={() => removeInvitee(invitee.email)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {/* Performers/Speakers */}
      <div>
        <h4 className="font-semibold mb-2">Performers / Speakers</h4>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Name"
            value={newPerformerName}
            onChange={(e) => setNewPerformerName(e.target.value)}
          />
          <Input
            placeholder="Role (e.g., Speaker, Musician)"
            value={newPerformerRole}
            onChange={(e) => setNewPerformerRole(e.target.value)}
          />
          <Input
            placeholder="Bio"
            value={newPerformerBio}
            onChange={(e) => setNewPerformerBio(e.target.value)}
          />
          <Input
            placeholder="Photo URL"
            value={newPerformerPhoto}
            onChange={(e) => setNewPerformerPhoto(e.target.value)}
          />
          <Button onClick={addPerformer}>Add Performer</Button>
        </div>
        <ul>
          {galaPerformers.map((p) => (
            <li key={p.name} className="mb-1 flex items-center gap-2">
              <span>{p.name} ({p.role})</span>
              <Button size="sm" variant="destructive" onClick={() => removePerformer(p.name)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {/* Program Schedule */}
      <div>
        <h4 className="font-semibold mb-2">Program Schedule</h4>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Time (e.g., 19:00)"
            value={newProgramTime}
            onChange={(e) => setNewProgramTime(e.target.value)}
          />
          <Input
            placeholder="Title"
            value={newProgramTitle}
            onChange={(e) => setNewProgramTitle(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={newProgramDesc}
            onChange={(e) => setNewProgramDesc(e.target.value)}
          />
          <Button onClick={addProgramItem}>Add Item</Button>
        </div>
        <ul>
          {galaProgram.map((item) => (
            <li key={item.title} className="mb-1 flex items-center gap-2">
              <span>{item.time} - {item.title}</span>
              <Button size="sm" variant="destructive" onClick={() => removeProgramItem(item.title)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 
