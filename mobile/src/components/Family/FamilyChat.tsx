import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { familyCoordinationService, FamilyHelpers } from '../../services/FamilyCoordinationService';

interface FamilyMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  petId?: string;
  messageType: 'text' | 'task_update' | 'health_alert' | 'photo' | 'file';
  content: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  timestamp: string;
  readBy: string[];
  reactions?: any[];
}

interface FamilyChatProps {
  petId?: string;
  recipientId?: string; // For direct messages
}

export const FamilyChat: React.FC<FamilyChatProps> = ({ petId, recipientId }) => {
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = familyCoordinationService.getCurrentUser();
      const messageList = familyCoordinationService.getMessages(petId, recipientId);
      
      setCurrentUser(user);
      setMessages(messageList);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [petId, recipientId]);

  const setupMessageListener = useCallback(() => {
    // In a real app, this would set up real-time listeners
    const cleanup = familyCoordinationService.onMessagesUpdate((updatedMessages: any) => {
      setMessages(updatedMessages.filter((msg: any) => {
        if (petId && msg.petId !== petId) return false;
        if (recipientId && msg.recipientId !== recipientId) return false;
        return true;
      }));
    });

    return cleanup;
  }, [petId, recipientId]);

  useEffect(() => {
    loadData();
    setupMessageListener();
  }, [petId, recipientId, loadData, setupMessageListener]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const message = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId,
        petId,
        messageType: 'text' as const,
        content: newMessage.trim(),
      };

      await familyCoordinationService.sendMessage(message);
      setNewMessage('');
      
      // Refresh messages
      await loadData();
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!currentUser) return;
    
    try {
      await familyCoordinationService.markMessageAsRead(messageId, currentUser.id);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    try {
      await familyCoordinationService.addMessageReaction(messageId, emoji, currentUser.id);
      await loadData(); // Refresh to show updated reactions
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const renderMessage = (message: FamilyMessage, index: number) => {
    const isOwnMessage = currentUser && message.senderId === currentUser.id;
    const isUnread = currentUser && !message.readBy.includes(currentUser.id);

    // Mark as read when rendering unread message
    if (isUnread && !isOwnMessage) {
      markMessageAsRead(message.id);
    }

    const showSender = !isOwnMessage && (
      index === 0 || 
      messages[index - 1]?.senderId !== message.senderId ||
      (new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp).getTime()) > 300000 // 5 minutes
    );

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {showSender && !isOwnMessage && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            message.messageType !== 'text' && styles.specialMessage,
          ]}
        >
          {message.messageType !== 'text' && (
            <View style={styles.messageTypeIndicator}>
              <Text style={styles.messageTypeIcon}>
                {FamilyHelpers.getMessageTypeIcon(message.messageType)}
              </Text>
              <Text style={styles.messageTypeLabel}>
                {message.messageType.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          )}
          
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {FamilyHelpers.formatMessageTime(message.timestamp)}
            </Text>
            
            {isOwnMessage && (
              <View style={styles.readIndicator}>
                <Ionicons
                  name={message.readBy.length > 1 ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={message.readBy.length > 1 ? '#4CAF50' : '#999'}
                />
              </View>
            )}
          </View>
        </View>

        {/* Message Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((reaction, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.reactionBubble}
                onPress={() => addReaction(message.id, reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Reactions */}
        <TouchableOpacity
          style={styles.reactionButton}
          onPress={() => {
            const reactions = ['👍', '❤️', '😊', '🐾'];
            // In a real app, this would show a reaction picker
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            addReaction(message.id, randomReaction);
          }}
        >
          <Ionicons name="add-circle-outline" size={16} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  const getPlaceholderText = () => {
    if (recipientId) {
      const recipient = familyCoordinationService.getFamilyMember(recipientId);
      return `Message ${recipient?.name || 'family member'}...`;
    }
    if (petId) {
      return 'Send a message about this pet...';
    }
    return 'Send a message to the family...';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start the conversation!
            </Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={getPlaceholderText()}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? '#fff' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export const FamilyMessagePreview: React.FC<{
  message: FamilyMessage;
  onPress: () => void;
}> = ({ message, onPress }) => {
  const currentUser = familyCoordinationService.getCurrentUser();
  const isUnread = currentUser && !message.readBy.includes(currentUser.id) && 
                   message.senderId !== currentUser.id;

  return (
    <TouchableOpacity style={styles.previewContainer} onPress={onPress}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewSender}>{message.senderName}</Text>
        <Text style={styles.previewTime}>
          {FamilyHelpers.formatMessageTime(message.timestamp)}
        </Text>
      </View>
      
      <View style={styles.previewContent}>
        <Text style={styles.previewTypeIcon}>
          {FamilyHelpers.getMessageTypeIcon(message.messageType)}
        </Text>
        <Text
          style={[
            styles.previewText,
            isUnread && styles.previewTextUnread,
          ]}
          numberOfLines={2}
        >
          {message.content}
        </Text>
        {isUnread && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  messageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  specialMessage: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  messageTypeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  messageTypeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTime: {
    color: '#999',
  },
  readIndicator: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginHorizontal: 4,
  },
  reactionBubble: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 80,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sendButtonInactive: {
    backgroundColor: '#e0e0e0',
  },
  // Preview styles
  previewContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewSender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previewTime: {
    fontSize: 12,
    color: '#666',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewTypeIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  previewTextUnread: {
    fontWeight: '500',
    color: '#333',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
});